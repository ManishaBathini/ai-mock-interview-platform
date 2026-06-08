from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# Launch Chrome
driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install())
)

driver.maximize_window()

# Open Login Page
driver.get("https://ai-mock-interview-platform-peach-xi.vercel.app/")

time.sleep(3)

# Login
driver.find_element(By.ID, "email").send_keys("test@gmail.com")

driver.find_element(By.ID, "password").send_keys("password123")

driver.find_element(
    By.XPATH,
    "//button[@type='submit']"
).click()

print("Login Successful")

time.sleep(5)

# Manual navigation
input(
    "Navigate to Resume Upload page manually and press Enter..."
)

# Upload Resume
resume_input = driver.find_element(
    By.XPATH,
    "//input[@type='file']"
)

print("File input found")

resume_input.send_keys(
    r"YOUR_FULL_PDF_PATH"
)

print("Path sent successfully")

time.sleep(3)

button = driver.find_element(
    By.XPATH,
    "//button[contains(text(),'Start Interview')]"
)

print("Button found:", button.text)

# Click Start Interview
driver.find_element(
    By.XPATH,
    "//button[contains(text(),'Start Interview')]"
).click()

print("Start Interview Clicked")

time.sleep(5)

# Verification
print("Current URL:", driver.current_url)

input("Press Enter to close browser...")

driver.quit()