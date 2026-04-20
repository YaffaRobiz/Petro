"""
Dashboard tests: metric cards for the redesigned dashboard.
"""
from playwright.sync_api import expect
from conftest import TEST_PLATE, TEST_VEHICLE, TEST_FUEL, TEST_MAINTENANCE


def test_dashboard_loads(auth_page, base_url):
    """Dashboard page loads and shows the key metric card labels."""
    auth_page.goto(f"{base_url}/")
    expect(auth_page.get_by_text("Dashboard")).to_be_visible()
    expect(auth_page.get_by_text("Monthly Spent")).to_be_visible()
    expect(auth_page.get_by_text("Odometer")).to_be_visible()
    expect(auth_page.get_by_text("Maintenance")).to_be_visible()


def test_dashboard_shows_fuel_consumption_after_two_fills(auth_page, base_url, test_vehicle):
    """Fuel Consumption card shows L/100km after two fill-ups."""
    # First fill-up
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}/fuel")
    auth_page.get_by_role("button", name="+ Add Fill-Up").click()
    auth_page.fill('input[name="odometer"]', "51000")
    auth_page.fill('input[name="liters"]', "42.50")
    auth_page.fill('input[name="cost"]', "68.00")
    auth_page.get_by_role("button", name="Save Fill-Up").click()
    auth_page.wait_for_load_state("networkidle")

    # Second fill-up (needed to compute L/100km)
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}/fuel")
    auth_page.get_by_role("button", name="+ Add Fill-Up").click()
    auth_page.fill('input[name="odometer"]', "52000")
    auth_page.fill('input[name="liters"]', "40.00")
    auth_page.fill('input[name="cost"]', "64.00")
    auth_page.get_by_role("button", name="Save Fill-Up").click()
    auth_page.wait_for_load_state("networkidle")

    auth_page.goto(f"{base_url}/")
    expect(auth_page.get_by_text("Fuel Consumption")).to_be_visible()
    expect(auth_page.get_by_text("L/100km").first).to_be_visible()


def test_dashboard_last_fillup_shows_after_add(auth_page, base_url, test_vehicle):
    """Last Fill-Up card shows cost and liters after adding a fill-up."""
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}/fuel")
    auth_page.get_by_role("button", name="+ Add Fill-Up").click()
    auth_page.fill('input[name="odometer"]', TEST_FUEL["odometer"])
    auth_page.fill('input[name="liters"]', TEST_FUEL["liters"])
    auth_page.fill('input[name="cost"]', TEST_FUEL["cost"])
    auth_page.get_by_role("button", name="Save Fill-Up").click()
    auth_page.wait_for_load_state("networkidle")

    auth_page.goto(f"{base_url}/")
    expect(auth_page.get_by_text("Last Fill-Up")).to_be_visible()
    expect(auth_page.get_by_text(f"€{float(TEST_FUEL['cost']):.2f}")).to_be_visible()


def test_dashboard_maintenance_shows_after_service(auth_page, base_url, test_vehicle):
    """Maintenance card shows the service type after adding one."""
    auth_page.goto(f"{base_url}/vehicles/{TEST_PLATE}/maintenance")
    auth_page.get_by_role("button", name="+ Add Service").click()
    auth_page.fill('input[name="odometer"]', TEST_MAINTENANCE["odometer"])
    auth_page.select_option('select[name="service_type"]', TEST_MAINTENANCE["service_type"])
    auth_page.fill('input[name="cost"]', TEST_MAINTENANCE["cost"])
    auth_page.fill('textarea[name="notes"]', TEST_MAINTENANCE["notes"])
    auth_page.get_by_role("button", name="Save Service").click()
    auth_page.wait_for_load_state("networkidle")

    auth_page.goto(f"{base_url}/")
    expect(auth_page.get_by_text(TEST_MAINTENANCE["service_type"])).to_be_visible()


def test_dashboard_new_fillup_button_navigates(auth_page, base_url, test_vehicle):
    """'+ New fill-up' button in the header navigates to the fuel page."""
    auth_page.goto(f"{base_url}/")
    auth_page.get_by_role("link", name="+ New fill-up").click()
    expect(auth_page).to_have_url(f"{base_url}/vehicles/{TEST_PLATE}/fuel")
