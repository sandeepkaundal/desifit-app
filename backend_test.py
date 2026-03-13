#!/usr/bin/env python3
"""
DesiFit Backend API Testing Suite
Tests all backend APIs systematically according to the review request.
"""

import requests
import json
import sys
from datetime import datetime, date
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://health-score-desi.preview.emergentagent.com/api"

class DesiFitAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.user_id = None
        self.food_id = None
        self.habit_id = None
        self.test_results = []
        self.failed_tests = []
        
    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append(f"{status} {test_name}: {details}")
        if not success:
            self.failed_tests.append(f"{test_name}: {details}")
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, params: Dict[str, str] = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, timeout=30)
            else:
                return False, f"Unsupported method: {method}", 400
                
            # Try to parse JSON response
            try:
                response_data = response.json()
            except:
                response_data = response.text
                
            return response.status_code == 200, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
            
    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n=== Testing Auth Flow ===")
        
        # Test signup
        user_data = {
            "phone": "9876543210",
            "name": "Test User",
            "age": 25,
            "height": 170,
            "currentWeight": 75,
            "goalWeight": 65,
            "gender": "male"
        }
        
        success, response, status = self.make_request("POST", "/auth/signup", user_data)
        
        if success and isinstance(response, dict) and "id" in response:
            self.user_id = response["id"]
            daily_goal = response.get("dailyCalorieGoal")
            if daily_goal and daily_goal > 0:
                self.log_result("Auth Signup", True, f"User created with ID: {self.user_id}, Daily goal: {daily_goal}")
            else:
                self.log_result("Auth Signup", False, "Daily calorie goal not calculated correctly")
        else:
            self.log_result("Auth Signup", False, f"Status: {status}, Response: {response}")
            return
            
        # Test login
        login_data = {"phone": "9876543210"}
        success, response, status = self.make_request("POST", "/auth/login", login_data)
        
        if success and isinstance(response, dict) and response.get("phone") == "9876543210":
            self.log_result("Auth Login", True, f"Login successful for user: {response.get('name')}")
        else:
            self.log_result("Auth Login", False, f"Status: {status}, Response: {response}")
            
    def test_foods_api(self):
        """Test foods endpoints"""
        print("\n=== Testing Foods API ===")
        
        if not self.user_id:
            self.log_result("Foods API", False, "No user ID available for testing")
            return
            
        # Initialize foods first
        success, response, status = self.make_request("POST", "/init-foods")
        if success:
            print(f"Foods initialized: {response}")
        
        # Test get foods
        params = {"user_id": self.user_id}
        success, response, status = self.make_request("GET", "/foods", params=params)
        
        if success and isinstance(response, list):
            food_count = len(response)
            if food_count >= 15:
                self.log_result("Foods Get All", True, f"Retrieved {food_count} foods")
                # Save a food ID for later tests
                if response:
                    self.food_id = response[0].get("id")
            else:
                self.log_result("Foods Get All", False, f"Expected 15+ foods, got {food_count}")
        else:
            self.log_result("Foods Get All", False, f"Status: {status}, Response: {response}")
            
        # Test food search
        params = {"user_id": self.user_id, "search": "rice"}
        success, response, status = self.make_request("GET", "/foods", params=params)
        
        if success and isinstance(response, list):
            rice_foods = [food for food in response if "rice" in food.get("name", "").lower()]
            if rice_foods:
                self.log_result("Foods Search", True, f"Found {len(rice_foods)} rice dishes")
            else:
                self.log_result("Foods Search", False, "No rice dishes found in search")
        else:
            self.log_result("Foods Search", False, f"Status: {status}, Response: {response}")
            
        # Test create custom food
        custom_food = {
            "name": "Custom Dal",
            "calories": 120,
            "servingSize": "100g",
            "category": "custom",
            "isCustom": True,
            "userId": self.user_id
        }
        
        success, response, status = self.make_request("POST", "/foods", custom_food)
        
        if success and isinstance(response, dict) and response.get("name") == "Custom Dal":
            self.log_result("Foods Create Custom", True, f"Custom food created with ID: {response.get('id')}")
        else:
            self.log_result("Foods Create Custom", False, f"Status: {status}, Response: {response}")
            
    def test_food_logging(self):
        """Test food logging endpoints"""
        print("\n=== Testing Food Logging ===")
        
        if not self.user_id or not self.food_id:
            self.log_result("Food Logging", False, "Missing user ID or food ID for testing")
            return
            
        today = date.today().strftime("%Y-%m-%d")
        
        # Test log food
        food_log = {
            "userId": self.user_id,
            "foodId": self.food_id,
            "foodName": "Rice (Cooked)",
            "quantity": 2,
            "calories": 260,
            "date": today
        }
        
        success, response, status = self.make_request("POST", "/food-logs", food_log)
        
        if success and isinstance(response, dict) and response.get("userId") == self.user_id:
            self.log_result("Food Log Create", True, f"Food logged with ID: {response.get('id')}")
        else:
            self.log_result("Food Log Create", False, f"Status: {status}, Response: {response}")
            
        # Test get food logs
        params = {"date": today}
        success, response, status = self.make_request("GET", f"/food-logs/{self.user_id}", params=params)
        
        if success and isinstance(response, list) and len(response) > 0:
            total_calories = sum(log.get("calories", 0) for log in response)
            self.log_result("Food Log Get", True, f"Retrieved {len(response)} food logs, Total calories: {total_calories}")
        else:
            self.log_result("Food Log Get", False, f"Status: {status}, Response: {response}")
            
    def test_exercise_logging(self):
        """Test exercise logging endpoints"""
        print("\n=== Testing Exercise Logging ===")
        
        if not self.user_id:
            self.log_result("Exercise Logging", False, "No user ID available for testing")
            return
            
        today = date.today().strftime("%Y-%m-%d")
        
        # Test log exercise
        exercise_log = {
            "userId": self.user_id,
            "activityType": "Walking",
            "duration": 30,
            "caloriesBurned": 125,
            "date": today
        }
        
        success, response, status = self.make_request("POST", "/exercise-logs", exercise_log)
        
        if success and isinstance(response, dict) and response.get("userId") == self.user_id:
            self.log_result("Exercise Log Create", True, f"Exercise logged with ID: {response.get('id')}")
        else:
            self.log_result("Exercise Log Create", False, f"Status: {status}, Response: {response}")
            
        # Test get exercise logs
        params = {"date": today}
        success, response, status = self.make_request("GET", f"/exercise-logs/{self.user_id}", params=params)
        
        if success and isinstance(response, list) and len(response) > 0:
            total_burned = sum(log.get("caloriesBurned", 0) for log in response)
            self.log_result("Exercise Log Get", True, f"Retrieved {len(response)} exercise logs, Total burned: {total_burned}")
        else:
            self.log_result("Exercise Log Get", False, f"Status: {status}, Response: {response}")
            
    def test_habits(self):
        """Test habits endpoints"""
        print("\n=== Testing Habits ===")
        
        if not self.user_id:
            self.log_result("Habits", False, "No user ID available for testing")
            return
            
        # Test create habit
        habit_data = {
            "userId": self.user_id,
            "habitName": "Drink Water"
        }
        
        success, response, status = self.make_request("POST", "/habits", habit_data)
        
        if success and isinstance(response, dict) and response.get("habitName") == "Drink Water":
            self.habit_id = response.get("id")
            self.log_result("Habit Create", True, f"Habit created with ID: {self.habit_id}")
        else:
            self.log_result("Habit Create", False, f"Status: {status}, Response: {response}")
            
        # Test toggle habit
        today = date.today().strftime("%Y-%m-%d")
        toggle_data = {
            "userId": self.user_id,
            "habitName": "Drink Water",
            "date": today,
            "completed": True
        }
        
        success, response, status = self.make_request("POST", "/habits/toggle", toggle_data)
        
        if success and isinstance(response, dict):
            streak = response.get("currentStreak", 0)
            self.log_result("Habit Toggle", True, f"Habit toggled, Current streak: {streak}")
        else:
            self.log_result("Habit Toggle", False, f"Status: {status}, Response: {response}")
            
        # Test get habits
        success, response, status = self.make_request("GET", f"/habits/{self.user_id}")
        
        if success and isinstance(response, list) and len(response) > 0:
            habit = response[0]
            current_streak = habit.get("currentStreak", 0)
            completed_dates = habit.get("completedDates", [])
            self.log_result("Habit Get", True, f"Retrieved habit with streak: {current_streak}, Completed: {len(completed_dates)} days")
        else:
            self.log_result("Habit Get", False, f"Status: {status}, Response: {response}")
            
    def test_weight_logs(self):
        """Test weight logging endpoints"""
        print("\n=== Testing Weight Logs ===")
        
        if not self.user_id:
            self.log_result("Weight Logs", False, "No user ID available for testing")
            return
            
        today = date.today().strftime("%Y-%m-%d")
        
        # Test log weight
        weight_data = {
            "userId": self.user_id,
            "weight": 74.5,
            "date": today
        }
        
        success, response, status = self.make_request("POST", "/weight-logs", weight_data)
        
        if success and isinstance(response, dict) and response.get("weight") == 74.5:
            self.log_result("Weight Log Create", True, f"Weight logged: {response.get('weight')}kg on {response.get('date')}")
        else:
            self.log_result("Weight Log Create", False, f"Status: {status}, Response: {response}")
            
        # Test get weight logs
        success, response, status = self.make_request("GET", f"/weight-logs/{self.user_id}")
        
        if success and isinstance(response, list) and len(response) > 0:
            latest_weight = response[0].get("weight")
            self.log_result("Weight Log Get", True, f"Retrieved {len(response)} weight logs, Latest: {latest_weight}kg")
        else:
            self.log_result("Weight Log Get", False, f"Status: {status}, Response: {response}")
            
    def test_dashboard(self):
        """Test dashboard endpoint"""
        print("\n=== Testing Dashboard ===")
        
        if not self.user_id:
            self.log_result("Dashboard", False, "No user ID available for testing")
            return
            
        today = date.today().strftime("%Y-%m-%d")
        params = {"date": today}
        
        success, response, status = self.make_request("GET", f"/dashboard/{self.user_id}", params=params)
        
        if success and isinstance(response, dict):
            required_fields = [
                "caloriesConsumed", "caloriesBurned", "dailyCalorieGoal", 
                "remainingCalories", "habitsCompleted", "totalHabits",
                "currentWeight", "goalWeight", "weightChange"
            ]
            
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                details = f"Consumed: {response['caloriesConsumed']}, Burned: {response['caloriesBurned']}, "
                details += f"Goal: {response['dailyCalorieGoal']}, Habits: {response['habitsCompleted']}/{response['totalHabits']}"
                self.log_result("Dashboard", True, details)
            else:
                self.log_result("Dashboard", False, f"Missing fields: {missing_fields}")
        else:
            self.log_result("Dashboard", False, f"Status: {status}, Response: {response}")
            
    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting DesiFit Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in sequence
        self.test_auth_flow()
        self.test_foods_api()
        self.test_food_logging()
        self.test_exercise_logging()
        self.test_habits()
        self.test_weight_logs()
        self.test_dashboard()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        failed_count = len(self.failed_tests)
        passed_count = total_tests - failed_count
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_count}")
        print(f"Failed: {failed_count}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
                
        print(f"\n✅ Overall Success Rate: {(passed_count/total_tests)*100:.1f}%")
        
        return failed_count == 0

if __name__ == "__main__":
    tester = DesiFitAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)