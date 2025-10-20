import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PrescriptionList } from "../components/PrescriptionList";
import type { StoredPrescription } from "@repo/contracts";

describe("PrescriptionList", () => {
  const mockPrescriptions: StoredPrescription[] = [
    {
      id: 1,
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
    {
      id: 2,
      signaturerx_prescription_id: "RX789012",
      patient_name: "Jane Smith",
      patient_email: "jane.smith@example.com",
      status: "PENDING",
      medicines: JSON.stringify([
        {
          description: "Ibuprofen 200mg",
          qty: "20",
          directions: "Take twice daily",
        },
        {
          description: "Vitamin D 1000IU",
          qty: "30",
          directions: "Take once daily",
        },
      ]),
      created_at: "2024-01-16T14:20:00Z",
      updated_at: "2024-01-16T14:20:00Z",
    },
  ];

  it("renders loading state when isLoading is true", () => {
    render(<PrescriptionList prescriptions={[]} isLoading={true} />);

    expect(screen.getByText("Loading prescriptions...")).toBeInTheDocument();
  });

  it("renders empty state when no prescriptions exist", () => {
    render(<PrescriptionList prescriptions={[]} isLoading={false} />);

    expect(
      screen.getByText(
        "No prescriptions yet. Create your first prescription above!",
      ),
    ).toBeInTheDocument();
  });

  it("renders prescription history title when prescriptions exist", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getByText("Prescription History")).toBeInTheDocument();
  });

  it("displays all prescriptions", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("jane.smith@example.com")).toBeInTheDocument();
  });

  it("displays prescription status badges", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });

  it("displays prescription IDs", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getByText("RX123456")).toBeInTheDocument();
    expect(screen.getByText("RX789012")).toBeInTheDocument();
  });

  it('displays "Pending" when prescription ID is not available', () => {
    const prescriptionsWithoutId: StoredPrescription[] = [
      {
        ...mockPrescriptions[0],
        signaturerx_prescription_id: null,
      },
    ];

    render(
      <PrescriptionList
        prescriptions={prescriptionsWithoutId}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("displays formatted creation dates", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getAllByText("Created:")).toHaveLength(2);
    // Date formatting varies by locale, so just check the labels exist
  });

  it("displays formatted update dates", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getAllByText("Last Updated:")).toHaveLength(2);
    // Date formatting varies by locale, so just check the labels exist
  });

  it("displays medication details for each prescription", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getByText(/Paracetamol 500mg/)).toBeInTheDocument();
    expect(screen.getByText(/Qty: 10/)).toBeInTheDocument();
    expect(screen.getByText(/Take as directed/)).toBeInTheDocument();
  });

  it("displays multiple medications for a prescription", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getByText(/Ibuprofen 200mg/)).toBeInTheDocument();
    expect(screen.getByText(/Vitamin D 1000IU/)).toBeInTheDocument();
  });

  it("renders prescription cards with correct structure", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    const cards = screen
      .getAllByText(/Prescription ID:/i)
      .map((el) => el.closest(".prescription-card"));
    expect(cards).toHaveLength(2);
  });

  it("applies correct status class to status badges", () => {
    const { container } = render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    const activeStatus = container.querySelector(".status-active");
    const pendingStatus = container.querySelector(".status-pending");

    expect(activeStatus).toBeInTheDocument();
    expect(pendingStatus).toBeInTheDocument();
  });

  it("displays patient email for each prescription", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("jane.smith@example.com")).toBeInTheDocument();
  });

  it("renders medicines list section for each prescription", () => {
    render(
      <PrescriptionList prescriptions={mockPrescriptions} isLoading={false} />,
    );

    const medicationsHeaders = screen.getAllByText("Medications:");
    expect(medicationsHeaders).toHaveLength(2);
  });

  it("handles empty medicines array gracefully", () => {
    const prescriptionWithNoMeds: StoredPrescription[] = [
      {
        ...mockPrescriptions[0],
        medicines: JSON.stringify([]),
      },
    ];

    render(
      <PrescriptionList
        prescriptions={prescriptionWithNoMeds}
        isLoading={false}
      />,
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
