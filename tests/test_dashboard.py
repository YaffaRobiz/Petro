"""
Dashboard tests: stats cards and recent activity feed.
Depends on the test_vehicle fixture.
"""
from playwright.sync_api import expect
from conftest import TEST_PLATE, TEST_VEHICLE, TEST_FUEL, TEST_MAINTENANCE


def test_dashboard_loads(auth_page, base_url):
    """Dashboard page loads and shows the stats section."""
    auth_page.goto(f"{base_url}/")
    expect(auth_page.get_by_text("Dashboard")).to_be_visible()
    expect(auth_page.get_by_text("Vehicles")).to_be_visible()
    expect(auth_page.get_by_text("Fuel Fill-Ups")).to_be_visible()
    expect(auth_page.get_by_text("Services")).to_be_visible()
    expect(auth_page.get_by_text("Total Spent")).to_be_visible()


def test_dashboard_vehicles_stat_increments(auth_page, base_url, test_vehicle):
    """Vehicles stat card reflects the added [TEST] vehicle."""
    auth_page.goto(f"{base_url}/")

    # The Vehicles card should show at least 1
    vehicles_card = auth_page.locator(".bg-white.rounded-xl").filter(has_text="Vehicles").first
    count_text = vehicles_card.locator("p.text-3xl").text_content()
    assert int(count_text) >= 1


def test_dashboard_recent_activity_shows_fuel_log(auth_page, base_url, test_vehicle):
    """A fuel fill-up for the [TEST] vehicle appears in recent activity."""
    # Add a fill-up
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}/fuel")
    auth_page.get_by_role("button", name="+ Add Fill-Up").click()
    auth_page.fill('input[name="odometer"]', TEST_FUEL["odometer"])
    auth_page.fill('input[name="liters"]', TEST_FUEL["liters"])
    auth_page.fill('input[name="cost"]', TEST_FUEL["cost"])
    auth_page.get_by_role("button", name="Save Fill-Up").click()
    auth_page.wait_for_load_state("networkidle")

    # Check dashboard
    auth_page.goto(f"{base_url}/")
    expect(auth_page.get_by_text("Fill-Up")).to_be_visible()
    expect(auth_page.get_by_text(TEST_VEHICLE["nickname"])).to_be_visible()


def test_dashboard_recent_activity_shows_maintenance_log(auth_page, base_url, test_vehicle):
    """A maintenance service for the [TEST] vehicle appears in recent activity."""
    # Add a service
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}/maintenance")
    auth_page.get_by_role("button", name="+ Add Service").click()
    auth_page.fill('input[name="odometer"]', TEST_MAINTENANCE["odometer"])
    auth_page.select_option('select[name="service_type"]', TEST_MAINTENANCE["service_type"])
    auth_page.fill('input[name="cost"]', TEST_MAINTENANCE["cost"])
    auth_page.fill('textarea[name="notes"]', TEST_MAINTENANCE["notes"])
    auth_page.get_by_role("button", name="Save Service").click()
    auth_page.wait_for_load_state("networkidle")

    # Check dashboard
    auth_page.goto(f"{base_url}/")
    expect(auth_page.get_by_text(TEST_MAINTENANCE["service_type"])).to_be_visible()
    expect(auth_page.get_by_text(TEST_VEHICLE["nickname"])).to_be_visible()


def test_vehicle_name_in_activity_links_to_detail(auth_page, base_url, test_vehicle):
    """Clicking a vehicle name in the activity feed navigates to its detail page."""
    # Add a fill-up so there's activity
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}/fuel")
    auth_page.get_by_role("button", name="+ Add Fill-Up").click()
    auth_page.fill('input[name="odometer"]', TEST_FUEL["odometer"])
    auth_page.fill('input[name="liters"]', TEST_FUEL["liters"])
    auth_page.fill('input[name="cost"]', TEST_FUEL["cost"])
    auth_page.get_by_role("button", name="Save Fill-Up").click()
    auth_page.wait_for_load_state("networkidle")

    auth_page.goto(f"{base_url}/")
    auth_page.get_by_role("link", name=TEST_VEHICLE["nickname"]).first.click()
    auth_page.wait_for_url(f"{base_url}/vehicles/{TEST_PLATE}")
    expect(auth_page).to_have_url(f"{base_url}/vehicles/{TEST_PLATE}")
