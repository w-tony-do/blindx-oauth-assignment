import type { Medicine, StoredPrescription } from "@contract";
import { useEffect, useState } from "react";
import { apiClient } from "./api/client";
import "./App.css";
import {
  PrescriptionForm,
  PrescriptionFormData,
} from "./components/PrescriptionForm";
import { PrescriptionList } from "./components/PrescriptionList";

function App() {
  const [medications, setMedications] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<StoredPrescription[]>([]);
  const [isLoadingMedications, setIsLoadingMedications] = useState(true);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load medications on mount
  useEffect(() => {
    loadMedications();
    loadPrescriptions();
  }, []);

  const loadMedications = async () => {
    try {
      setIsLoadingMedications(true);
      const response = await apiClient.medications.list();

      if (response.status === 200) {
        setMedications(response.body.meds);
      } else {
        setError("Failed to load medications");
      }
    } catch (err) {
      console.error("Error loading medications:", err);
      setError("Failed to load medications");
    } finally {
      setIsLoadingMedications(false);
    }
  };

  const loadPrescriptions = async () => {
    try {
      setIsLoadingPrescriptions(true);
      const response = await apiClient.prescriptions.list();

      if (response.status === 200) {
        setPrescriptions(response.body.prescriptions);
      } else {
        setError("Failed to load prescriptions");
      }
    } catch (err) {
      console.error("Error loading prescriptions:", err);
      setError("Failed to load prescriptions");
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  const handleSubmitPrescription = async (formData: PrescriptionFormData) => {
    if (!formData.selectedMedication) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const clinicId = parseInt(
        import.meta.env.VITE_SIGNATURERX_CLINIC_ID || "842",
        10,
      );

      const prescriptionPayload = {
        action: "issueForDelivery" as const,
        contact_id: 0,
        clinic_id: clinicId,
        aff_tag: `Prescription for ${formData.patient.first_name} ${formData.patient.last_name}`,
        secure_pin: formData.secure_pin,
        notify: true,
        send_sms: true,
        invoice_clinic: false,
        delivery_address: formData.delivery_address,
        prescription_id: "",
        patient: formData.patient,
        notes: "",
        client_ref_id: "",
        medicines: [
          {
            object: "medicine" as const,
            id: 0,
            VPID: formData.selectedMedication.snomedId,
            APID: "",
            VPPID: "",
            APPID: "",
            description: formData.selectedMedication.displayName,
            qty: formData.quantity,
            directions: formData.directions,
          },
        ],
        prescriber_ip: "127.0.0.1",
      };

      const response = await apiClient.prescriptions.create({
        body: prescriptionPayload,
      });

      if (response.status === 200) {
        setSuccess(
          `✅ Prescription created successfully! ID: ${response.body.prescription_id || response.body.id}`,
        );
        // Reload prescriptions list
        await loadPrescriptions();
      } else if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 500
      ) {
        setError(`Failed to create prescription: ${response.body.error}`);
      }
    } catch (err: unknown) {
      console.error("Error creating prescription:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to create prescription: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏥 Blinx PACO - SignatureRx Integration</h1>
        <p>Prescription Management System</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)} className="alert-close">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess(null)} className="alert-close">
              ×
            </button>
          </div>
        )}

        <div className="container">
          <div className="form-container">
            {isLoadingMedications ? (
              <div className="loading">Loading medications...</div>
            ) : (
              <PrescriptionForm
                medications={medications}
                onSubmit={handleSubmitPrescription}
                isLoading={isSubmitting}
              />
            )}
          </div>

          <div className="list-container">
            <PrescriptionList
              prescriptions={prescriptions}
              isLoading={isLoadingPrescriptions}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
