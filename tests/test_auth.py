"""
Auth tests: login, logout, protected route redirect.
"""
import os
from playwright.sync_api import Page, expect


TEST_EMAIL = os.environ.get("TEST_USER_EMAIL", "")
TEST_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "")


def test_login_redirects_to_dashboard(browser, base_url):
    """Successful login lands on the dashboard."""
    context = browser.new_context()
    page = context.new_page()

    page.goto(f"{base_url}/login")
    page.get_by_label("Email").fill(TEST_EMAIL)
    page.get_by_label("Password").fill(TEST_PASSWORD)
    page.get_by_role("button", name="Sign in").click()

    page.wait_for_url(f"{base_url}/")
    expect(page).to_have_url(f"{base_url}/")
    context.close()


def test_invalid_login_shows_error(browser, base_url):
    """Wrong credentials show an error message."""
    context = browser.new_context()
    page = context.new_page()

    page.goto(f"{base_url}/login")
    page.get_by_label("Email").fill("wrong@example.com")
    page.get_by_label("Password").fill("wrongpassword")
    page.get_by_role("button", name="Sign in").click()

    expect(page.locator(".bg-red-50")).to_be_visible()
    context.close()


def test_protected_route_redirects_to_login(browser, base_url):
    """Visiting a protected route while logged out redirects to /login."""
    context = browser.new_context()
    page = context.new_page()

    page.goto(f"{base_url}/vehicles")
    page.wait_for_url(f"{base_url}/login")
    expect(page).to_have_url(f"{base_url}/login")
    context.close()


def test_logout_redirects_to_login(auth_page, base_url):
    """Clicking Log out lands on /login."""
    auth_page.goto(f"{base_url}/")
    auth_page.get_by_role("button", name="Log out").click()
    auth_page.wait_for_url(f"{base_url}/login")
    expect(auth_page).to_have_url(f"{base_url}/login")


def test_login_page_not_shown_when_authenticated(auth_page, base_url):
    """Visiting /login while already logged in redirects to dashboard."""
    auth_page.goto(f"{base_url}/login")
    auth_page.wait_for_url(f"{base_url}/")
    expect(auth_page).to_have_url(f"{base_url}/")
