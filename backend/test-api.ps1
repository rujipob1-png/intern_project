# Test API Script for Leave Management System
# Run: .\test-api.ps1

$baseUrl = "http://localhost:3000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Leave Management API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl" -Method GET
    Write-Host "   [PASS] API is running: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login as Admin
Write-Host ""
Write-Host "2. Testing Admin Login (50001)..." -ForegroundColor Yellow
try {
    $loginBody = '{"employeeCode":"50001","password":"123456"}'
    $loginResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $adminToken = $loginResult.data.token
    Write-Host "   [PASS] Admin login successful" -ForegroundColor Green
    Write-Host "   - Role: $($loginResult.data.user.role_name)" -ForegroundColor Gray
    Write-Host "   - Name: $($loginResult.data.user.first_name) $($loginResult.data.user.last_name)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get Admin Profile
Write-Host ""
Write-Host "3. Testing Get Profile..." -ForegroundColor Yellow
try {
    $userProfile = Invoke-RestMethod -Uri "$baseUrl/api/auth/profile" -Method GET -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "   [PASS] Profile retrieved" -ForegroundColor Green
    Write-Host "   - Leave Balance: Sick=$($userProfile.data.leaveBalance.sick), Personal=$($userProfile.data.leaveBalance.personal), Vacation=$($userProfile.data.leaveBalance.vacation)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get All Users (Admin)
Write-Host ""
Write-Host "4. Testing Get All Users (Admin)..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Method GET -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "   [PASS] Users retrieved" -ForegroundColor Green
    Write-Host "   - Total Users: $($users.data.users.Count)" -ForegroundColor Gray
    
    # Count by hire_date ranges
    $usersWithHireDate = $users.data.users | Where-Object { $_.hireDate }
    Write-Host "   - Users with hire_date: $($usersWithHireDate.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Login as Regular User
Write-Host ""
Write-Host "5. Testing User Login (51417)..." -ForegroundColor Yellow
try {
    $userLoginBody = '{"employeeCode":"51417","password":"123456"}'
    $userLoginResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $userLoginBody -ContentType "application/json"
    $userToken = $userLoginResult.data.token
    Write-Host "   [PASS] User login successful" -ForegroundColor Green
    Write-Host "   - Role: $($userLoginResult.data.user.role_name)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Leave Balance
Write-Host ""
Write-Host "6. Testing Get Leave Balance..." -ForegroundColor Yellow
try {
    $balance = Invoke-RestMethod -Uri "$baseUrl/api/leaves/balance" -Method GET -Headers @{Authorization="Bearer $userToken"}
    Write-Host "   [PASS] Balance retrieved" -ForegroundColor Green
    Write-Host "   - Sick: $($balance.data.sick) days" -ForegroundColor Gray
    Write-Host "   - Personal: $($balance.data.personal) days" -ForegroundColor Gray
    Write-Host "   - Vacation: $($balance.data.vacation) days" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get Leave Types
Write-Host ""
Write-Host "7. Testing Get Leave Types..." -ForegroundColor Yellow
try {
    $leaveTypes = Invoke-RestMethod -Uri "$baseUrl/api/leave-types" -Method GET -Headers @{Authorization="Bearer $userToken"}
    Write-Host "   [PASS] Leave types retrieved" -ForegroundColor Green
    Write-Host "   - Total types: $($leaveTypes.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Get My Leaves
Write-Host ""
Write-Host "8. Testing Get My Leaves..." -ForegroundColor Yellow
try {
    $myLeaves = Invoke-RestMethod -Uri "$baseUrl/api/leaves" -Method GET -Headers @{Authorization="Bearer $userToken"}
    Write-Host "   [PASS] My leaves retrieved" -ForegroundColor Green
    Write-Host "   - Total leave requests: $($myLeaves.data.leaves.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Get Pending Leaves (Admin)
Write-Host ""
Write-Host "9. Testing Get Pending Leaves (Admin)..." -ForegroundColor Yellow
try {
    $pending = Invoke-RestMethod -Uri "$baseUrl/api/admin/leaves/pending" -Method GET -Headers @{Authorization="Bearer $adminToken"}
    Write-Host "   [PASS] Pending leaves retrieved" -ForegroundColor Green
    Write-Host "   - Pending count: $($pending.data.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Get Notifications
Write-Host ""
Write-Host "10. Testing Get Notifications..." -ForegroundColor Yellow
try {
    $notifs = Invoke-RestMethod -Uri "$baseUrl/api/notifications" -Method GET -Headers @{Authorization="Bearer $userToken"}
    Write-Host "   [PASS] Notifications retrieved" -ForegroundColor Green
    Write-Host "   - Total notifications: $($notifs.data.notifications.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
