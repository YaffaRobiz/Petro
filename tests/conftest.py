import pytest
import os
from playwright.sync_api import Browser, Page

# ── Environment ────────────────────────────────────────────────
TEST_EMAIL = os.environ.get("TEST_USER_EMAIL", "")
TEST_PASSWORD = os.environ.get("TEST_USER_PASSWORD", "")

# ── Test data (all identifiable by [TEST] prefix) ──────────────
TEST_PLATE = "TEST-E2E"

TEST_VEHICLE = {
    "make": "Toyota",
    "model": "Corolla E2E",
    "year": "2020",
    "fuel_type": "Petrol",
    "license_plate": TEST_PLATE,
    "nickname": "[TEST] Corolla",
    "odometer": "50000",
}

TEST_FUEL = {
    "odometer": "51000",
    "liters": "42.50",
    "cost": "68.00",
}

TEST_MAINTENANCE = {
    "odometer": "51000",
    "service_type": "Oil Change",
    "cost": "95.00",
    "notes": "[TEST] automated test note",
}


# ── Session-scoped browser (launch once for all tests) ─────────
@pytest.fixture(scope="session")
def browser(playwright):
    browser = playwright.chromium.launch(headless=True)
    yield browser
    browser.close()


# ── Log in once, save storage state, reuse across tests ────────
@pytest.fixture(scope="session")
def auth_state(browser, base_url, tmp_path_factory):
    """Logs in once and saves the browser storage state to a temp file."""
    context = browser.new_context()
    page = context.new_page()

    page.goto(f"{base_url}/login")
    page.get_by_label("Email").fill(TEST_EMAIL)
    page.get_by_label("Password").fill(TEST_PASSWORD)
    page.get_by_role("button", name="Sign in").click()
    page.wait_for_url(f"{base_url}/")

    state_path = str(tmp_path_factory.mktemp("auth") / "state.json")
    context.storage_state(path=state_path)
    context.close()
    return state_path


# ── Per-test authenticated page ────────────────────────────────
@pytest.fixture
def auth_page(browser, base_url, auth_state):
    """Each test gets a fresh page that is already authenticated."""
    context = browser.new_context(storage_state=auth_state)
    page = context.new_page()
    yield page
    context.close()


# ── Helpers ────────────────────────────────────────────────────
def cleanup_test_vehicle(page: Page, base_url: str) -> None:
    """Delete the [TEST] vehicle if it exists (also cascades fuel + maintenance logs)."""
    page.goto(f"{base_url}/vehicles")
    page.wait_for_load_state("networkidle")

    # Only attempt delete if the [TEST] vehicle card is visible
    card = page.locator(f"text={TEST_VEHICLE['nickname']}").first
    if card.count() == 0:
        return

    # Click the delete button on the card that contains [TEST] nickname
    vehicle_card = page.locator(".bg-white.rounded-xl").filter(
        has_text=TEST_VEHICLE["nickname"]
    )
    vehicle_card.get_by_label("Delete").click()

    # Confirm inline prompt
    vehicle_card.get_by_role("button", name="Yes").click()
    page.wait_for_load_state("networkidle")


# ── [TEST] vehicle fixture (create → yield → delete) ──────────
@pytest.fixture
def test_vehicle(auth_page, base_url):
    """Creates a [TEST] vehicle before the test and deletes it after."""
    # Pre-cleanup in case a previous run left orphaned data
    cleanup_test_vehicle(auth_page, base_url)

    # Create the vehicle
    auth_page.goto(f"{base_url}/vehicles/new")
    auth_page.select_option('select[name="make"]', TEST_VEHICLE["make"])
    auth_page.fill('input[name="model"]', TEST_VEHICLE["model"])
    auth_page.fill('input[name="year"]', TEST_VEHICLE["year"])
    auth_page.select_option('select[name="fuel_type"]', TEST_VEHICLE["fuel_type"])
    auth_page.fill('input[name="license_plate"]', TEST_VEHICLE["license_plate"])
    auth_page.fill('input[name="nickname"]', TEST_VEHICLE["nickname"])
    auth_page.fill('input[name="initial_odometer"]', TEST_VEHICLE["odometer"])
    auth_page.get_by_role("button", name="Save Vehicle").click()
    auth_page.wait_for_url(f"{base_url}/")

    yield TEST_VEHICLE

    # Post-test cleanup
    cleanup_test_vehicle(auth_page, base_url)
