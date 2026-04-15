"""
Maintenance log tests: add, verify stats, edit, delete.
Depends on the test_vehicle fixture which handles [TEST] vehicle lifecycle.
"""
from playwright.sync_api import expect
from conftest import TEST_PLATE, TEST_MAINTENANCE


def go_to_maintenance_page(page, base_url):
    page.goto(f"{base_url}/vehicles/{TEST_PLATE}/maintenance")
    page.wait_for_load_state("networkidle")


def add_test_service(page, base_url):
    go_to_maintenance_page(page, base_url)
    page.get_by_role("button", name="+ Add Service").click()
    page.fill('input[name="odometer"]', TEST_MAINTENANCE["odometer"])
    page.select_option('select[name="service_type"]', TEST_MAINTENANCE["service_type"])
    page.fill('input[name="cost"]', TEST_MAINTENANCE["cost"])
    page.fill('textarea[name="notes"]', TEST_MAINTENANCE["notes"])
    page.get_by_role("button", name="Save Service").click()
    page.wait_for_load_state("networkidle")


def test_add_service_appears_in_table(auth_page, base_url, test_vehicle):
    """A new service entry appears in the maintenance log table."""
    add_test_service(auth_page, base_url)

    expect(auth_page.get_by_text(TEST_MAINTENANCE["service_type"])).to_be_visible()
    expect(auth_page.get_by_text(f"€{float(TEST_MAINTENANCE['cost']):.2f}")).to_be_visible()


def test_maintenance_notes_visible(auth_page, base_url, test_vehicle):
    """Notes with [TEST] prefix are visible in the table."""
    add_test_service(auth_page, base_url)

    expect(auth_page.get_by_text(TEST_MAINTENANCE["notes"])).to_be_visible()


def test_maintenance_stats_update_after_add(auth_page, base_url, test_vehicle):
    """Stats row shows correct service count and total cost after adding."""
    add_test_service(auth_page, base_url)

    expect(auth_page.get_by_text("1").first).to_be_visible()
    expect(auth_page.get_by_text(f"€{float(TEST_MAINTENANCE['cost']):.2f}")).to_be_visible()


def test_last_service_date_shows_in_stats(auth_page, base_url, test_vehicle):
    """Last Service stat card shows a date after adding a service."""
    add_test_service(auth_page, base_url)

    # The "Last Service" card should no longer show "—"
    last_service_card = auth_page.locator(".bg-white.rounded-xl").filter(
        has_text="Last Service"
    )
    expect(last_service_card.get_by_text("—")).not_to_be_visible()


def test_edit_service(auth_page, base_url, test_vehicle):
    """Editing a service entry updates the row with new values."""
    add_test_service(auth_page, base_url)

    auth_page.get_by_label("Edit").first.click()

    cost_input = auth_page.locator('input[name="cost"]').first
    cost_input.fill("110.00")

    auth_page.get_by_role("button", name="Save").first.click()
    auth_page.wait_for_load_state("networkidle")

    expect(auth_page.get_by_text("€110.00")).to_be_visible()


def test_delete_service(auth_page, base_url, test_vehicle):
    """Deleting a service entry removes it from the table."""
    add_test_service(auth_page, base_url)

    expect(auth_page.get_by_text(TEST_MAINTENANCE["service_type"])).to_be_visible()

    auth_page.get_by_label("Delete").first.click()
    auth_page.get_by_role("button", name="Yes").first.click()
    auth_page.wait_for_load_state("networkidle")

    expect(auth_page.get_by_text(TEST_MAINTENANCE["notes"])).not_to_be_visible()
