"""
Vehicle tests: add, view detail, delete.
All test data uses the [TEST] prefix and is cleaned up after each test.
"""
from playwright.sync_api import expect
from conftest import TEST_VEHICLE, TEST_PLATE, cleanup_test_vehicle


def test_add_vehicle_appears_in_list(auth_page, base_url, test_vehicle):
    """A newly created [TEST] vehicle shows up on the vehicles list page."""
    auth_page.goto(f"{base_url}/vehicles")
    expect(auth_page.get_by_text(TEST_VEHICLE["nickname"])).to_be_visible()


def test_vehicle_card_shows_correct_details(auth_page, base_url, test_vehicle):
    """Vehicle card shows year, license plate, and fuel type."""
    auth_page.goto(f"{base_url}/vehicles")
    card = auth_page.locator(".bg-white.rounded-xl").filter(
        has_text=TEST_VEHICLE["nickname"]
    )
    expect(card.get_by_text(TEST_VEHICLE["year"])).to_be_visible()
    expect(card.get_by_text(TEST_PLATE)).to_be_visible()
    expect(card.get_by_text(TEST_VEHICLE["fuel_type"])).to_be_visible()


def test_vehicle_detail_page_shows_info(auth_page, base_url, test_vehicle):
    """Vehicle detail page shows all vehicle information."""
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}")

    expect(auth_page.get_by_text(TEST_VEHICLE["nickname"])).to_be_visible()
    expect(auth_page.get_by_text(TEST_VEHICLE["year"])).to_be_visible()
    expect(auth_page.get_by_text(TEST_PLATE)).to_be_visible()
    expect(auth_page.get_by_text(TEST_VEHICLE["fuel_type"])).to_be_visible()


def test_vehicle_detail_has_fuel_and_maintenance_links(auth_page, base_url, test_vehicle):
    """Vehicle detail page has links to Fuel Logs and Maintenance Logs."""
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}")

    expect(auth_page.get_by_role("link", name="Fuel Logs")).to_be_visible()
    expect(auth_page.get_by_role("link", name="Maintenance Logs")).to_be_visible()


def test_delete_vehicle(auth_page, base_url):
    """Deleting a [TEST] vehicle removes it from the list."""
    # Pre-cleanup then recreate fresh
    cleanup_test_vehicle(auth_page, base_url)

    # Create
    auth_page.goto(f"{base_url}/vehicles/new")
    auth_page.select_option('select[name="make"]', TEST_VEHICLE["make"])
    auth_page.fill('input[name="model"]', TEST_VEHICLE["model"])
    auth_page.fill('input[name="year"]', TEST_VEHICLE["year"])
    auth_page.select_option('select[name="fuel_type"]', TEST_VEHICLE["fuel_type"])
    auth_page.fill('input[name="license_plate"]', TEST_VEHICLE["license_plate"])
    auth_page.fill('input[name="nickname"]', TEST_VEHICLE["nickname"])
    auth_page.fill('input[name="initial_odometer"]', TEST_VEHICLE["odometer"])
    auth_page.get_by_role("button", name="Save Vehicle").click()
    auth_page.wait_for_url(f"{base_url}/vehicles/{TEST_PLATE}")

    # Delete
    auth_page.goto(f"{base_url}/vehicles")
    vehicle_card = auth_page.locator(".bg-white.rounded-xl").filter(
        has_text=TEST_VEHICLE["nickname"]
    )
    vehicle_card.get_by_label("Delete").click()
    vehicle_card.get_by_role("button", name="Yes").click()
    auth_page.wait_for_load_state("networkidle")

    # Confirm gone
    expect(auth_page.get_by_text(TEST_VEHICLE["nickname"])).not_to_be_visible()
