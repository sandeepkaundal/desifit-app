from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

# ==================== MODELS ====================

class UserCreate(BaseModel):
    phone: str
    name: str
    age: int
    height: float  # in cm
    currentWeight: float  # in kg
    goalWeight: float  # in kg
    gender: str = "male"  # for BMR calculation

class UserResponse(BaseModel):
    id: str
    phone: str
    name: str
    age: int
    height: float
    currentWeight: float
    goalWeight: float
    gender: str
    dailyCalorieGoal: float
    createdAt: datetime

class UserLogin(BaseModel):
    phone: str

class Food(BaseModel):
    name: str
    calories: float  # per 100g or per piece
    servingSize: str  # "100g" or "1 piece"
    category: str = "indian"
    isCustom: bool = False
    userId: Optional[str] = None

class FoodResponse(BaseModel):
    id: str
    name: str
    calories: float
    servingSize: str
    category: str
    isCustom: bool
    userId: Optional[str] = None

class FoodLogCreate(BaseModel):
    userId: str
    foodId: str
    foodName: str
    quantity: float  # multiplier
    calories: float
    date: str  # YYYY-MM-DD format

class FoodLogResponse(BaseModel):
    id: str
    userId: str
    foodId: str
    foodName: str
    quantity: float
    calories: float
    date: str
    timestamp: datetime

class ExerciseLogCreate(BaseModel):
    userId: str
    activityType: str
    duration: int  # in minutes
    caloriesBurned: float
    date: str  # YYYY-MM-DD

class ExerciseLogResponse(BaseModel):
    id: str
    userId: str
    activityType: str
    duration: int
    caloriesBurned: float
    date: str
    timestamp: datetime

class HabitCreate(BaseModel):
    userId: str
    habitName: str

class HabitToggle(BaseModel):
    userId: str
    habitName: str
    date: str  # YYYY-MM-DD
    completed: bool

class HabitResponse(BaseModel):
    id: str
    userId: str
    habitName: str
    completedDates: List[str]
    currentStreak: int
    longestStreak: int

class WeightLogCreate(BaseModel):
    userId: str
    weight: float
    date: str  # YYYY-MM-DD

class WeightLogResponse(BaseModel):
    id: str
    userId: str
    weight: float
    date: str
    timestamp: datetime

class DashboardResponse(BaseModel):
    caloriesConsumed: float
    caloriesBurned: float
    dailyCalorieGoal: float
    remainingCalories: float
    habitsCompleted: int
    totalHabits: int
    currentWeight: float
    goalWeight: float
    weightChange: float

# ==================== HELPER FUNCTIONS ====================

def calculate_bmr(weight: float, height: float, age: int, gender: str) -> float:
    """Calculate Basal Metabolic Rate"""
    if gender.lower() == "male":
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    return bmr * 1.2  # Sedentary activity level

def calculate_exercise_calories(activity: str, duration: int) -> float:
    """Calculate calories burned based on activity and duration"""
    calories_per_hour = {
        "walking": 250,
        "running": 600,
        "cycling": 500,
        "yoga": 250,
        "skipping": 700,
        "gym": 400
    }
    activity_lower = activity.lower()
    rate = calories_per_hour.get(activity_lower, 300)
    return (rate / 60) * duration

def calculate_streaks(completed_dates: List[str]) -> tuple:
    """Calculate current and longest streak from completed dates"""
    if not completed_dates:
        return 0, 0
    
    sorted_dates = sorted(completed_dates, reverse=True)
    today = date.today()
    
    # Calculate current streak
    current_streak = 0
    check_date = today
    
    for date_str in sorted_dates:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        if date_obj == check_date:
            current_streak += 1
            check_date = date_obj - timedelta(days=1)
        else:
            break
    
    # Calculate longest streak
    longest_streak = 1
    temp_streak = 1
    
    for i in range(len(sorted_dates) - 1):
        date1 = datetime.strptime(sorted_dates[i], "%Y-%m-%d").date()
        date2 = datetime.strptime(sorted_dates[i + 1], "%Y-%m-%d").date()
        
        if (date1 - date2).days == 1:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1
    
    return current_streak, longest_streak

# ==================== ROUTES ====================

# User & Auth Routes
@api_router.post("/auth/signup", response_model=UserResponse)
async def signup(user: UserCreate):
    # Check if phone already exists
    existing = await db.users.find_one({"phone": user.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Calculate daily calorie goal
    daily_goal = calculate_bmr(user.currentWeight, user.height, user.age, user.gender)
    
    user_doc = {
        **user.dict(),
        "dailyCalorieGoal": daily_goal,
        "createdAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_doc["id"] = str(result.inserted_id)
    del user_doc["_id"]
    
    return UserResponse(**user_doc)

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"phone": credentials.phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(**serialize_doc(user))

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**serialize_doc(user))

@api_router.put("/users/{user_id}/calorie-goal")
async def update_calorie_goal(user_id: str, goal: float):
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"dailyCalorieGoal": goal}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Calorie goal updated", "dailyCalorieGoal": goal}

# Food Routes
@api_router.get("/foods", response_model=List[FoodResponse])
async def get_foods(user_id: str, search: Optional[str] = None):
    query = {"$or": [{"isCustom": False}, {"userId": user_id}]}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    foods = await db.foods.find(query).to_list(1000)
    return [FoodResponse(**serialize_doc(food)) for food in foods]

@api_router.post("/foods", response_model=FoodResponse)
async def create_food(food: Food):
    food_doc = food.dict()
    result = await db.foods.insert_one(food_doc)
    food_doc["id"] = str(result.inserted_id)
    del food_doc["_id"]
    return FoodResponse(**food_doc)

@api_router.post("/food-logs", response_model=FoodLogResponse)
async def log_food(log: FoodLogCreate):
    log_doc = {
        **log.dict(),
        "timestamp": datetime.utcnow()
    }
    result = await db.food_logs.insert_one(log_doc)
    log_doc["id"] = str(result.inserted_id)
    del log_doc["_id"]
    return FoodLogResponse(**log_doc)

@api_router.get("/food-logs/{user_id}", response_model=List[FoodLogResponse])
async def get_food_logs(user_id: str, date: str):
    logs = await db.food_logs.find({"userId": user_id, "date": date}).to_list(1000)
    return [FoodLogResponse(**serialize_doc(log)) for log in logs]

@api_router.delete("/food-logs/{log_id}")
async def delete_food_log(log_id: str):
    result = await db.food_logs.delete_one({"_id": ObjectId(log_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Food log deleted"}

# Exercise Routes
@api_router.post("/exercise-logs", response_model=ExerciseLogResponse)
async def log_exercise(log: ExerciseLogCreate):
    log_doc = {
        **log.dict(),
        "timestamp": datetime.utcnow()
    }
    result = await db.exercise_logs.insert_one(log_doc)
    log_doc["id"] = str(result.inserted_id)
    del log_doc["_id"]
    return ExerciseLogResponse(**log_doc)

@api_router.get("/exercise-logs/{user_id}", response_model=List[ExerciseLogResponse])
async def get_exercise_logs(user_id: str, date: str):
    logs = await db.exercise_logs.find({"userId": user_id, "date": date}).to_list(1000)
    return [ExerciseLogResponse(**serialize_doc(log)) for log in logs]

@api_router.delete("/exercise-logs/{log_id}")
async def delete_exercise_log(log_id: str):
    result = await db.exercise_logs.delete_one({"_id": ObjectId(log_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Exercise log deleted"}

# Habit Routes
@api_router.post("/habits", response_model=HabitResponse)
async def create_habit(habit: HabitCreate):
    # Check if habit already exists
    existing = await db.habits.find_one({"userId": habit.userId, "habitName": habit.habitName})
    if existing:
        return HabitResponse(**serialize_doc(existing))
    
    habit_doc = {
        **habit.dict(),
        "completedDates": [],
        "currentStreak": 0,
        "longestStreak": 0
    }
    result = await db.habits.insert_one(habit_doc)
    habit_doc["id"] = str(result.inserted_id)
    del habit_doc["_id"]
    return HabitResponse(**habit_doc)

@api_router.post("/habits/toggle")
async def toggle_habit(toggle: HabitToggle):
    habit = await db.habits.find_one({"userId": toggle.userId, "habitName": toggle.habitName})
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    
    completed_dates = habit.get("completedDates", [])
    
    if toggle.completed:
        if toggle.date not in completed_dates:
            completed_dates.append(toggle.date)
    else:
        if toggle.date in completed_dates:
            completed_dates.remove(toggle.date)
    
    # Recalculate streaks
    from datetime import timedelta
    current_streak, longest_streak = calculate_streaks(completed_dates)
    
    await db.habits.update_one(
        {"_id": habit["_id"]},
        {"$set": {
            "completedDates": completed_dates,
            "currentStreak": current_streak,
            "longestStreak": longest_streak
        }}
    )
    
    return {"message": "Habit updated", "currentStreak": current_streak}

@api_router.get("/habits/{user_id}", response_model=List[HabitResponse])
async def get_habits(user_id: str):
    habits = await db.habits.find({"userId": user_id}).to_list(1000)
    return [HabitResponse(**serialize_doc(habit)) for habit in habits]

# Weight Routes
@api_router.post("/weight-logs", response_model=WeightLogResponse)
async def log_weight(log: WeightLogCreate):
    # Update user's current weight
    await db.users.update_one(
        {"_id": ObjectId(log.userId)},
        {"$set": {"currentWeight": log.weight}}
    )
    
    log_doc = {
        **log.dict(),
        "timestamp": datetime.utcnow()
    }
    result = await db.weight_logs.insert_one(log_doc)
    log_doc["id"] = str(result.inserted_id)
    del log_doc["_id"]
    return WeightLogResponse(**log_doc)

@api_router.get("/weight-logs/{user_id}", response_model=List[WeightLogResponse])
async def get_weight_logs(user_id: str):
    logs = await db.weight_logs.find({"userId": user_id}).sort("date", -1).to_list(1000)
    return [WeightLogResponse(**serialize_doc(log)) for log in logs]

# Dashboard Route
@api_router.get("/dashboard/{user_id}", response_model=DashboardResponse)
async def get_dashboard(user_id: str, date: str):
    # Get user
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get today's food logs
    food_logs = await db.food_logs.find({"userId": user_id, "date": date}).to_list(1000)
    calories_consumed = sum(log.get("calories", 0) for log in food_logs)
    
    # Get today's exercise logs
    exercise_logs = await db.exercise_logs.find({"userId": user_id, "date": date}).to_list(1000)
    calories_burned = sum(log.get("caloriesBurned", 0) for log in exercise_logs)
    
    # Get habits
    habits = await db.habits.find({"userId": user_id}).to_list(1000)
    total_habits = len(habits)
    habits_completed = sum(1 for habit in habits if date in habit.get("completedDates", []))
    
    # Get weight change
    weight_logs = await db.weight_logs.find({"userId": user_id}).sort("date", 1).to_list(1000)
    weight_change = 0
    if weight_logs:
        initial_weight = weight_logs[0].get("weight", user["currentWeight"])
        weight_change = user["currentWeight"] - initial_weight
    
    daily_goal = user.get("dailyCalorieGoal", 2000)
    remaining = daily_goal - calories_consumed + calories_burned
    
    return DashboardResponse(
        caloriesConsumed=calories_consumed,
        caloriesBurned=calories_burned,
        dailyCalorieGoal=daily_goal,
        remainingCalories=remaining,
        habitsCompleted=habits_completed,
        totalHabits=total_habits,
        currentWeight=user["currentWeight"],
        goalWeight=user["goalWeight"],
        weightChange=weight_change
    )

# Initialize pre-populated Indian foods
@api_router.post("/init-foods")
async def initialize_foods():
    # Check if already initialized
    count = await db.foods.count_documents({"isCustom": False})
    if count > 0:
        return {"message": "Foods already initialized", "count": count}
    
    indian_foods = [
        {"name": "Roti (Chapati)", "calories": 70, "servingSize": "1 piece", "category": "indian", "isCustom": False},
        {"name": "Rice (Cooked)", "calories": 130, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Dal (Cooked)", "calories": 100, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Paneer Sabzi", "calories": 180, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Poha", "calories": 160, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Idli", "calories": 39, "servingSize": "1 piece", "category": "indian", "isCustom": False},
        {"name": "Dosa", "calories": 120, "servingSize": "1 piece", "category": "indian", "isCustom": False},
        {"name": "Rajma", "calories": 140, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Chole", "calories": 164, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Paratha", "calories": 300, "servingSize": "1 piece", "category": "indian", "isCustom": False},
        {"name": "Sambar", "calories": 80, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Upma", "calories": 150, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Aloo Sabzi", "calories": 130, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Biryani", "calories": 200, "servingSize": "100g", "category": "indian", "isCustom": False},
        {"name": "Khichdi", "calories": 120, "servingSize": "100g", "category": "indian", "isCustom": False},
    ]
    
    await db.foods.insert_many(indian_foods)
    return {"message": "Foods initialized successfully", "count": len(indian_foods)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
