#!/usr/bin/env python3
"""
Backend API Testing for SIEM PYMEs System
Tests all API endpoints with proper authentication flow
"""

import requests
import sys
import json
from datetime import datetime

class SIEMBackendTester:
    def __init__(self, base_url="https://pymedefense.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'N/A')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, f"Error: {str(e)}")
            return False

    def test_login_without_2fa(self):
        """Test login with invalid credentials (should fail)"""
        try:
            login_data = {
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }
            response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=10)
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected 401 for invalid credentials)"
            self.log_test("Login Invalid Credentials", success, details)
            return success
        except Exception as e:
            self.log_test("Login Invalid Credentials", False, f"Error: {str(e)}")
            return False

    def test_login_with_2fa_step1(self):
        """Test login step 1 - should request 2FA"""
        try:
            login_data = {
                "email": "admin@pymesiem.com",
                "password": "admin123"
            }
            response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('requires_2fa', False) == True
                details = f"Status: {response.status_code}, Requires 2FA: {data.get('requires_2fa')}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Login Step 1 (2FA Request)", success, details)
            return success
        except Exception as e:
            self.log_test("Login Step 1 (2FA Request)", False, f"Error: {str(e)}")
            return False

    def test_login_with_2fa_complete(self):
        """Test complete login with 2FA code"""
        try:
            login_data = {
                "email": "admin@pymesiem.com",
                "password": "admin123",
                "codigo_2fa": "123456"
            }
            response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = 'access_token' in data and 'user' in data
                if success:
                    self.token = data['access_token']
                    details = f"Status: {response.status_code}, Token received, User: {data['user'].get('email')}"
                else:
                    details = f"Status: {response.status_code}, Missing token or user data"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Login Complete (2FA)", success, details)
            return success
        except Exception as e:
            self.log_test("Login Complete (2FA)", False, f"Error: {str(e)}")
            return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        if not self.token:
            self.log_test("Dashboard Stats", False, "No authentication token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.api_url}/dashboard/stats", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['eventos_hoy', 'eventos_semana', 'alertas_abiertas', 'logins_fallidos_hoy']
                success = all(field in data for field in required_fields)
                details = f"Status: {response.status_code}, Fields: {list(data.keys())}"
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Dashboard Stats", success, details)
            return success
        except Exception as e:
            self.log_test("Dashboard Stats", False, f"Error: {str(e)}")
            return False

    def test_events_endpoint(self):
        """Test events endpoint"""
        if not self.token:
            self.log_test("Events Endpoint", False, "No authentication token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.api_url}/events?limit=5", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Events count: {len(data)}"
                if data and len(data) > 0:
                    event = data[0]
                    required_fields = ['id', 'timestamp', 'source_ip', 'event_type', 'severity']
                    has_required = all(field in event for field in required_fields)
                    details += f", Has required fields: {has_required}"
                    success = success and has_required
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Events Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Events Endpoint", False, f"Error: {str(e)}")
            return False

    def test_alerts_endpoint(self):
        """Test alerts endpoint"""
        if not self.token:
            self.log_test("Alerts Endpoint", False, "No authentication token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.api_url}/alerts?limit=5", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Alerts count: {len(data)}"
                if data and len(data) > 0:
                    alert = data[0]
                    required_fields = ['id', 'rule_name', 'severity', 'status', 'created_at']
                    has_required = all(field in alert for field in required_fields)
                    details += f", Has required fields: {has_required}"
                    success = success and has_required
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Alerts Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Alerts Endpoint", False, f"Error: {str(e)}")
            return False

    def test_security_tips_endpoint(self):
        """Test security tips endpoint"""
        try:
            response = requests.get(f"{self.api_url}/security-tips", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                success = isinstance(data, list) and len(data) > 0
                details = f"Status: {response.status_code}, Tips count: {len(data)}"
                if data and len(data) > 0:
                    tip = data[0]
                    required_fields = ['titulo', 'descripcion', 'categoria']
                    has_required = all(field in tip for field in required_fields)
                    details += f", Has required fields: {has_required}"
                    success = success and has_required
            else:
                success = False
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Security Tips Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Security Tips Endpoint", False, f"Error: {str(e)}")
            return False

    def test_unauthorized_access(self):
        """Test that protected endpoints require authentication"""
        try:
            response = requests.get(f"{self.api_url}/dashboard/stats", timeout=10)
            success = response.status_code == 401 or response.status_code == 403
            details = f"Status: {response.status_code} (Expected 401/403 for unauthorized access)"
            self.log_test("Unauthorized Access Protection", success, details)
            return success
        except Exception as e:
            self.log_test("Unauthorized Access Protection", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting SIEM Backend API Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_api_root,
            self.test_unauthorized_access,
            self.test_login_without_2fa,
            self.test_login_with_2fa_step1,
            self.test_login_with_2fa_complete,
            self.test_dashboard_stats,
            self.test_events_endpoint,
            self.test_alerts_endpoint,
            self.test_security_tips_endpoint,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, f"Unexpected error: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed!")
            failed_tests = [r for r in self.test_results if r['status'] == 'FAIL']
            print("\nFailed tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    tester = SIEMBackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())