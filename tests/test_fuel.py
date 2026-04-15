"""
Fuel log tests: add, verify stats, edit, delete.
Depends on the test_vehicle fixture which handles [TEST] vehicle lifecycle.
"""
from playwright.sync_api import expect
from conftest import TEST_PLATE, TEST_FUEL


def go_to_fuel_page(page, base_url):
    page.goto(f"{base_url}/vehicles/{TEST_PLATE}/fuel")
    page.wait_for_load_state("networkidle")


def add_test_fill_up(page, base_url, odometer=None):
    go_to_fuel_page(page, base_url)
    page.get_by_role("button", name="+ Add Fill-Up").click()
    page.fill('input[name="odometer"]', odometer or TEST_FUEL["odometer"])
    page.fill('input[name="liters"]', TEST_FUEL["liters"])
    page.fill('input[name="cost"]', TEST_FUEL["cost"])
    page.get_by_role("button", name="Save Fill-Up").click()
    page.wait_for_load_state("networkidle")


def test_add_fill_up_appears_in_table(auth_page, base_url, test_vehicle):
    """A new fill-up entry appears in the fuel log table."""
    add_test_fill_up(auth_page, base_url)

    expect(auth_page.get_by_text(f"{TEST_FUEL['liters']} L")).to_be_visible()
    expect(auth_page.get_by_text(f"€{float(TEST_FUEL['cost']):.2f}")).to_be_visible()


def test_fuel_stats_update_after_add(auth_page, base_url, test_vehicle):
    """Stats row shows correct fill-up count and total cost after adding."""
    add_test_fill_up(auth_page, base_url)

    # Fill-ups stat card should show 1
    expect(auth_page.get_by_text("1").first).to_be_visible()
    # Total cost card
    expect(auth_page.get_by_text(f"€{float(TEST_FUEL['cost']):.2f}")).to_be_visible()


def test_cost_per_liter_calculated(auth_page, base_url, test_vehicle):
    """The €/L column is automatically calculated (cost ÷ liters)."""
    add_test_fill_up(auth_page, base_url)

    expected_cpl = float(TEST_FUEL["cost"]) / float(TEST_FUEL["liters"])
    expect(auth_page.get_by_text(f"€{expected_cpl:.3f}")).to_be_visible()


def test_edit_fill_up(auth_page, base_url, test_vehicle):
    """Editing a fill-up updates the row with new values."""
    add_test_fill_up(auth_page, base_url)

    # Open edit mode
    auth_page.get_by_label("Edit").first.click()

    # Change cost
    cost_input = auth_page.locator('input[name="cost"]').first
    cost_input.fill("75.00")

    auth_page.get_by_role("button", name="Save").first.click()
    auth_page.wait_for_load_state("networkidle")

    expect(auth_page.get_by_text("€75.00")).to_be_visible()


def test_km_per_liter_calculated_with_two_fill_ups(auth_page, base_url, test_vehicle):
    """With two fill-ups, the second shows a km/L value based on odometer diff."""
    # First fill-up at odometer 51000
    add_test_fill_up(auth_page, base_url, odometer="51000")

    # Second fill-up at 52000 km with 40 liters → km/L = (52000-51000)/40 = 25.0
    go_to_fuel_page(auth_page, base_url)
    auth_page.get_by_role("button", name="+ Add Fill-Up").click()
    auth_page.fill('input[name="odometer"]', "52000")
    auth_page.fill('input[name="liters"]', "40.00")
    auth_page.fill('input[name="cost"]', "64.00")
    auth_page.get_by_role("button", name="Save Fill-Up").click()
    auth_page.wait_for_load_state("networkidle")

    # The second fill-up (odometer 52000) should show 25.0 in the km/L column
    expect(auth_page.get_by_text("25.0")).to_be_visible()
    # Avg Efficiency stat card should also show a value (not —)
    expect(auth_page.get_by_text("km/L")).to_be_visible()


def test_delete_fill_up(auth_page, base_url, test_vehicle):
    """Deleting a fill-up removes it from the table."""
    add_test_fill_up(auth_page, base_url)

    # Confirm the row exists
    expect(auth_page.get_by_text(f"{TEST_FUEL['liters']} L")).to_be_visible()

    # Delete
    auth_page.get_by_label("Delete").first.click()
    auth_page.get_by_role("button", name="Yes").first.click()
    auth_page.wait_for_load_state("networkidle")

    # Row should be gone
    expect(auth_page.get_by_text(f"{TEST_FUEL['liters']} L")).not_to_be_visible()
