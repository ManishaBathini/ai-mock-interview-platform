from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install())
)

driver.get("https://ai-mock-interview-platform-peach-xi.vercel.app/")

time.sleep(2)

driver.find_element(By.ID, "email").send_keys("unknown93918@gmail.com")

driver.find_element(By.ID, "password").send_keys("123456")

driver.find_element(By.XPATH, "//button[@type='submit']").click()

time.sleep(4)

print(driver.current_url)

input("Press Enter...")