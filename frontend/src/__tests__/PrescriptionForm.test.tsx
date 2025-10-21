import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PrescriptionForm,
  PrescriptionFormData,
} from "../components/PrescriptionForm";
import type { Medicine } from "@contract";

describe("PrescriptionForm", () => {
  const mockMedications: Medicine[] = [
    {
      snomedId: "123456",
      displayName: "Paracetamol 500mg",
      type: "tablet",
      unlicensed: false,
      endorsements: {},
      prescribeByBrandOnly: false,
      bnfExactMatch: null,
      bnfMatches: null,
      applianceTypes: [],
    },
    {
      snomedId: "789012",
      displayName: "Ibuprofen 200mg",
      type: "capsule",
      unlicensed: false,
      endorsements: {},
      prescribeByBrandOnly: false,
      bnfExactMatch: null,
      bnfMatches: null,
      applianceTypes: [],
    },
  ];

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders the form with all sections", () => {
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Create Prescription" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Select Medication")).toBeInTheDocument();
    expect(screen.getByText("Patient Information")).toBeInTheDocument();
    expect(screen.getByText("Delivery Address")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();
  });

  it("displays all medications in the dropdown", () => {
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const select = screen.getByLabelText("Medication *");
    expect(select).toBeInTheDocument();

    mockMedications.forEach((med) => {
      expect(
        screen.getByText(`${med.displayName} (${med.type})`),
      ).toBeInTheDocument();
    });
  });

  it("displays medication details when a medication is selected", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const select = screen.getByLabelText("Medication *");
    await user.selectOptions(select, mockMedications[0]!.snomedId);

    expect(screen.getByText(/SNOMED ID:/)).toBeInTheDocument();
    expect(screen.getByText(mockMedications[0]!.snomedId)).toBeInTheDocument();
    expect(screen.getByText(/Type:/)).toBeInTheDocument();
    expect(screen.getByText(mockMedications[0]!.type)).toBeInTheDocument();
  });

  it("shows alert when submitting without selecting a medication", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const form = screen
      .getByRole("button", { name: "Create Prescription" })
      .closest("form");
    // Bypass browser validation by dispatching submit event directly
    if (form) {
      const event = new Event("submit", { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }

    expect(alertSpy).toHaveBeenCalledWith("Please select a medication");
    expect(mockOnSubmit).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("updates patient information fields", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const firstNameInput = screen.getByLabelText("First Name *");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Jane");

    expect(firstNameInput).toHaveValue("Jane");

    const lastNameInput = screen.getByLabelText("Last Name *");
    await user.clear(lastNameInput);
    await user.type(lastNameInput, "Smith");

    expect(lastNameInput).toHaveValue("Smith");
  });

  it("updates quantity and directions fields", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const quantityInput = screen.getByLabelText("Quantity *");
    await user.clear(quantityInput);
    await user.type(quantityInput, "20");

    const directionsInput = screen.getByLabelText("Directions *");
    await user.clear(directionsInput);
    await user.type(directionsInput, "Take twice daily");

    expect(quantityInput).toHaveValue(20);
    expect(directionsInput).toHaveValue("Take twice daily");
  });

  it('shows delivery address fields when "Same as patient address" is unchecked', async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const checkbox = screen.getByLabelText("Same as patient address");
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    expect(
      screen.getByLabelText("Address Line 1 *", {
        selector: "#del_address_ln1",
      }),
    ).toBeInTheDocument();
  });

  it("validates secure PIN format", () => {
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const pinInput = screen.getByLabelText("Secure PIN (6 digits) *");
    expect(pinInput).toHaveAttribute("pattern", "[0-9]{6}");
    expect(pinInput).toHaveAttribute("maxLength", "6");
  });

  it("submits form with correct data when all fields are filled", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const select = screen.getByLabelText("Medication *");
    await user.selectOptions(select, mockMedications[0]!.snomedId);

    const submitButton = screen.getByRole("button", {
      name: /Create Prescription/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData: PrescriptionFormData = mockOnSubmit.mock.calls[0]![0]!;
    expect(submittedData.selectedMedication).toEqual(mockMedications[0]);
    expect(submittedData.quantity).toBe("10");
    expect(submittedData.patient.first_name).toBe("John");
  });

  it("uses separate delivery address when checkbox is unchecked", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const select = screen.getByLabelText("Medication *");
    await user.selectOptions(select, mockMedications[0]!.snomedId);

    const checkbox = screen.getByLabelText("Same as patient address");
    await user.click(checkbox);

    const deliveryAddressInput = screen.getByLabelText("Address Line 1 *", {
      selector: "#del_address_ln1",
    });
    await user.clear(deliveryAddressInput);
    await user.type(deliveryAddressInput, "456 Different Street");

    const submitButton = screen.getByRole("button", {
      name: /Create Prescription/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData: PrescriptionFormData = mockOnSubmit.mock.calls[0]![0]!;
    expect(submittedData.delivery_address.address_ln1).toBe(
      "456 Different Street",
    );
  });

  it("disables submit button when loading", () => {
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />,
    );

    const submitButton = screen.getByRole("button", {
      name: /Creating Prescription/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("displays different button text when loading", () => {
    const { rerender } = render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Create Prescription" }),
    ).toBeInTheDocument();

    rerender(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Creating Prescription..." }),
    ).toBeInTheDocument();
  });

  it("renders all patient information fields", () => {
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(screen.getByLabelText("First Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Email *")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone *")).toBeInTheDocument();
    expect(screen.getByLabelText("Gender *")).toBeInTheDocument();
    expect(screen.getByLabelText("City *")).toBeInTheDocument();
    expect(screen.getByLabelText("Post Code *")).toBeInTheDocument();
    expect(screen.getByLabelText("Country *")).toBeInTheDocument();
  });

  it("renders gender dropdown with all options", () => {
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    expect(screen.getByRole("option", { name: "Male" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Female" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();
  });

  it("updates gender selection", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const genderSelect = screen.getByLabelText("Gender *");
    await user.selectOptions(genderSelect, "female");

    expect(genderSelect).toHaveValue("female");
  });

  it("updates date of birth fields", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const dayInput = screen.getByPlaceholderText("DD");
    const monthInput = screen.getByPlaceholderText("MM");
    const yearInput = screen.getByPlaceholderText("YYYY");

    await user.clear(dayInput);
    await user.type(dayInput, "25");
    await user.clear(monthInput);
    await user.type(monthInput, "12");
    await user.clear(yearInput);
    await user.type(yearInput, "1990");

    expect(dayInput).toHaveValue("25");
    expect(monthInput).toHaveValue("12");
    expect(yearInput).toHaveValue("1990");
  });

  it("updates address fields", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const address1Input = screen.getByLabelText("Address Line 1 *", {
      selector: "#address_ln1",
    });
    const address2Input = screen.getByLabelText("Address Line 2", {
      selector: "#address_ln2",
    });
    const cityInput = screen.getByLabelText("City *");
    const postCodeInput = screen.getByLabelText("Post Code *");
    const countryInput = screen.getByLabelText("Country *");

    await user.clear(address1Input);
    await user.type(address1Input, "456 New Street");
    await user.clear(address2Input);
    await user.type(address2Input, "Apt 101");
    await user.clear(cityInput);
    await user.type(cityInput, "Manchester");
    await user.clear(postCodeInput);
    await user.type(postCodeInput, "M1 1AA");
    await user.clear(countryInput);
    await user.type(countryInput, "UK");

    expect(address1Input).toHaveValue("456 New Street");
    expect(address2Input).toHaveValue("Apt 101");
    expect(cityInput).toHaveValue("Manchester");
    expect(postCodeInput).toHaveValue("M1 1AA");
    expect(countryInput).toHaveValue("UK");
  });

  it("updates email and phone fields", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const emailInput = screen.getByLabelText("Email *");
    const phoneInput = screen.getByLabelText("Phone *");

    await user.clear(emailInput);
    await user.type(emailInput, "newemail@test.com");
    await user.clear(phoneInput);
    await user.type(phoneInput, "447123456789");

    expect(emailInput).toHaveValue("newemail@test.com");
    expect(phoneInput).toHaveValue("447123456789");
  });

  it("updates delivery address fields when using separate address", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    // Uncheck "same as patient address"
    const checkbox = screen.getByLabelText("Same as patient address");
    await user.click(checkbox);

    const delAddress1 = screen.getByLabelText("Address Line 1 *", {
      selector: "#del_address_ln1",
    });
    const delAddress2 = screen.getByLabelText("Address Line 2", {
      selector: "#del_address_ln2",
    });
    const delCity = screen.getByLabelText("City *", { selector: "#del_city" });
    const delPostCode = screen.getByLabelText("Post Code *", {
      selector: "#del_post_code",
    });
    const delCountry = screen.getByLabelText("Country *", {
      selector: "#del_country",
    });

    await user.clear(delAddress1);
    await user.type(delAddress1, "789 Delivery St");
    await user.clear(delAddress2);
    await user.type(delAddress2, "Suite 5");
    await user.clear(delCity);
    await user.type(delCity, "Birmingham");
    await user.clear(delPostCode);
    await user.type(delPostCode, "B1 1AA");
    await user.clear(delCountry);
    await user.type(delCountry, "England");

    expect(delAddress1).toHaveValue("789 Delivery St");
    expect(delAddress2).toHaveValue("Suite 5");
    expect(delCity).toHaveValue("Birmingham");
    expect(delPostCode).toHaveValue("B1 1AA");
    expect(delCountry).toHaveValue("England");
  });

  it("updates secure PIN field", async () => {
    const user = userEvent.setup();
    render(
      <PrescriptionForm
        medications={mockMedications}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />,
    );

    const pinInput = screen.getByLabelText("Secure PIN (6 digits) *");
    await user.clear(pinInput);
    await user.type(pinInput, "123456");

    expect(pinInput).toHaveValue("123456");
  });
});
