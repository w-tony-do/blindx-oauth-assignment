import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Medicine, StoredPrescription } from "@contract";
import App from "../App";
import { apiClient } from "../api/client";

vi.mock("../api/client", () => ({
  apiClient: {
    medications: {
      list: vi.fn(),
    },
    prescriptions: {
      list: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("App", () => {
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
  ];

  const mockPrescriptions: StoredPrescription[] = [
    {
      id: "1",
      signaturerx_prescription_id: "RX123456",
      patient_name: "John Doe",
      patient_email: "john.doe@example.com",
      status: "ACTIVE",
      medicines: JSON.stringify([
        {
          description: "Paracetamol 500mg",
          qty: "10",
          directions: "Take as directed",
        },
      ]),
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the application header", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(apiClient.medications.list).toHaveBeenCalled();
      expect(apiClient.prescriptions.list).toHaveBeenCalled();
    });

    expect(
      screen.getByText("🏥 Blinx PACO - SignatureRx Integration"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Prescription Management System"),
    ).toBeInTheDocument();
  });

  it("loads medications on mount", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(apiClient.medications.list).toHaveBeenCalledTimes(1);
    });
  });

  it("loads prescriptions on mount", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: mockPrescriptions },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(apiClient.prescriptions.list).toHaveBeenCalledTimes(1);
      expect(apiClient.medications.list).toHaveBeenCalled();
    });
  });

  it("displays loading state while fetching medications", async () => {
    vi.mocked(apiClient.medications.list).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 200,
                body: { meds: [] },
                headers: new Headers(),
              } as any),
            100,
          ),
        ),
    );

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    render(<App />);

    expect(screen.getByText("Loading medications...")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText("Loading medications..."),
      ).not.toBeInTheDocument();
    });
  });

  it("displays error when medications fail to load", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 500,
      body: {} as any,
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load medications/),
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("displays error when prescriptions fail to load", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 500,
      body: {} as any,
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load prescriptions/),
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("renders PrescriptionForm when medications are loaded", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create Prescription" }),
      ).toBeInTheDocument();
    });
  });

  it("renders PrescriptionList with loaded prescriptions", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: mockPrescriptions },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Prescription History")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  it("closes error alert when close button is clicked", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 500,
      body: {} as any,
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load medications/),
      ).toBeInTheDocument();
    });

    const closeButton = screen.getAllByRole("button", { name: "×" })[0];
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/Failed to load medications/),
      ).not.toBeInTheDocument();
    });
  });

  it("displays success message after successful prescription creation", async () => {
    const user = userEvent.setup();

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    const listMock = vi.mocked(apiClient.prescriptions.list);
    listMock.mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.create).mockResolvedValue({
      status: 200,
      body: { prescription_id: "RX999", id: 999 },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create Prescription" }),
      ).toBeInTheDocument();
    });

    // Select medication
    const medicationSelect = screen.getByLabelText("Medication *");
    await user.selectOptions(medicationSelect, mockMedications[0]!.snomedId);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Prescription",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Prescription created successfully/),
      ).toBeInTheDocument();
    });

    // Verify prescriptions list was reloaded
    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it("handles API error during prescription creation", async () => {
    const user = userEvent.setup();

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.create).mockResolvedValue({
      status: 400,
      body: { error: "Invalid data" },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create Prescription" }),
      ).toBeInTheDocument();
    });

    // Select medication
    const medicationSelect = screen.getByLabelText("Medication *");
    await user.selectOptions(medicationSelect, mockMedications[0]!.snomedId);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Prescription",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create prescription: Invalid data/),
      ).toBeInTheDocument();
    });
  });

  it("displays loading state in PrescriptionList initially", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 200,
                body: { prescriptions: [] },
                headers: new Headers(),
              } as any),
            100,
          ),
        ),
    );

    render(<App />);

    expect(screen.getByText("Loading prescriptions...")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText("Loading prescriptions..."),
      ).not.toBeInTheDocument();
    });
  });

  it("renders main container with correct structure", async () => {
    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    const { container } = render(<App />);

    await waitFor(() => {
      const appMain = container.querySelector(".app-main");
      expect(appMain).toBeInTheDocument();
    });
  });

  it("handles network error during prescription creation", async () => {
    const user = userEvent.setup();

    // Suppress expected console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.create).mockRejectedValue(
      new Error("Network error"),
    );

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create Prescription" }),
      ).toBeInTheDocument();
    });

    // Select medication
    const medicationSelect = screen.getByLabelText("Medication *");
    await user.selectOptions(medicationSelect, mockMedications[0]!.snomedId);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Prescription",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create prescription: Network error/),
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("handles 401 error during prescription creation", async () => {
    const user = userEvent.setup();

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.create).mockResolvedValue({
      status: 401,
      body: { error: "Unauthorized" },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create Prescription" }),
      ).toBeInTheDocument();
    });

    // Select medication
    const medicationSelect = screen.getByLabelText("Medication *");
    await user.selectOptions(medicationSelect, mockMedications[0]!.snomedId);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Prescription",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create prescription: Unauthorized/),
      ).toBeInTheDocument();
    });
  });

  it("handles 500 error during prescription creation", async () => {
    const user = userEvent.setup();

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.create).mockResolvedValue({
      status: 500,
      body: { error: "Server error" },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create Prescription" }),
      ).toBeInTheDocument();
    });

    // Select medication
    const medicationSelect = screen.getByLabelText("Medication *");
    await user.selectOptions(medicationSelect, mockMedications[0]!.snomedId);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Prescription",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create prescription: Server error/),
      ).toBeInTheDocument();
    });
  });

  it("displays success alert with close functionality", async () => {
    const user = userEvent.setup();

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: mockMedications },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.create).mockResolvedValue({
      status: 200,
      body: { prescription_id: "RX999", id: 999 },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Create Prescription" }),
      ).toBeInTheDocument();
    });

    // Select medication
    const medicationSelect = screen.getByLabelText("Medication *");
    await user.selectOptions(medicationSelect, mockMedications[0]!.snomedId);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Create Prescription",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Prescription created successfully/),
      ).toBeInTheDocument();
    });

    // Close success alert
    const closeButtons = screen.getAllByRole("button", { name: "×" });
    const successCloseButton = closeButtons.find((btn) =>
      btn.closest(".alert-success"),
    );

    if (successCloseButton) {
      await user.click(successCloseButton);
      await waitFor(() => {
        expect(
          screen.queryByText(/Prescription created successfully/),
        ).not.toBeInTheDocument();
      });
    }
  });

  it("handles exception when loading medications", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(apiClient.medications.list).mockRejectedValue(
      new Error("Network error"),
    );

    vi.mocked(apiClient.prescriptions.list).mockResolvedValue({
      status: 200,
      body: { prescriptions: [] },
      headers: new Headers(),
    } as any);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load medications/),
      ).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading medications:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("handles exception when loading prescriptions", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(apiClient.medications.list).mockResolvedValue({
      status: 200,
      body: { meds: [] },
      headers: new Headers(),
    } as any);

    vi.mocked(apiClient.prescriptions.list).mockRejectedValue(
      new Error("Database error"),
    );

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load prescriptions/),
      ).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error loading prescriptions:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });
});
