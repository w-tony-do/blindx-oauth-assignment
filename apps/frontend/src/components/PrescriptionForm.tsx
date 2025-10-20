import type { Medicine } from "@repo/contracts";
import { FormEvent, useState } from "react";

interface PrescriptionFormProps {
  medications: Medicine[];
  onSubmit: (formData: PrescriptionFormData) => void;
  isLoading: boolean;
}

export interface PrescriptionFormData {
  selectedMedication: Medicine | null;
  quantity: string;
  directions: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    gender: "male" | "female" | "other";
    birth_day: string;
    birth_month: string;
    birth_year: string;
    address_ln1: string;
    address_ln2?: string;
    city: string;
    post_code: string;
    country: string;
  };
  delivery_address: {
    address_ln1: string;
    address_ln2?: string;
    city: string;
    post_code: string;
    country: string;
  };
  secure_pin: string;
}

export function PrescriptionForm({
  medications,
  onSubmit,
  isLoading,
}: PrescriptionFormProps) {
  const [selectedMedication, setSelectedMedication] = useState<Medicine | null>(
    null,
  );
  const [quantity, setQuantity] = useState("10");
  const [directions, setDirections] = useState("Take as directed");
  const [securePin, setSecurePin] = useState("111111");
  const [useSameAddress, setUseSameAddress] = useState(true);

  // Patient details with mock data
  const [patient, setPatient] = useState({
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "441234567890",
    gender: "male" as const,
    birth_day: "15",
    birth_month: "06",
    birth_year: "1985",
    address_ln1: "123 High Street",
    address_ln2: "",
    city: "London",
    post_code: "SW1A 1AA",
    country: "United Kingdom",
  });

  const [deliveryAddress, setDeliveryAddress] = useState({
    address_ln1: "123 High Street",
    address_ln2: "",
    city: "London",
    post_code: "SW1A 1AA",
    country: "United Kingdom",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!selectedMedication) {
      alert("Please select a medication");
      return;
    }

    const formData: PrescriptionFormData = {
      selectedMedication,
      quantity,
      directions,
      patient,
      delivery_address: useSameAddress
        ? {
            address_ln1: patient.address_ln1,
            address_ln2: patient.address_ln2,
            city: patient.city,
            post_code: patient.post_code,
            country: patient.country,
          }
        : deliveryAddress,
      secure_pin: securePin,
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="prescription-form">
      <h2>Create Prescription</h2>

      {/* Medication Selection */}
      <div className="form-section">
        <h3>Select Medication</h3>
        <div className="form-group">
          <label htmlFor="medication">Medication *</label>
          <select
            id="medication"
            value={selectedMedication?.snomedId || ""}
            onChange={(e) => {
              const med = medications.find(
                (m) => m.snomedId === e.target.value,
              );
              setSelectedMedication(med || null);
            }}
            required
            className="form-control"
          >
            <option value="">-- Select Medication --</option>
            {medications.map((med) => (
              <option key={med.snomedId} value={med.snomedId}>
                {med.displayName} ({med.type})
              </option>
            ))}
          </select>
        </div>

        {selectedMedication && (
          <div className="medication-details">
            <p>
              <strong>SNOMED ID:</strong> {selectedMedication.snomedId}
            </p>
            <p>
              <strong>Type:</strong> {selectedMedication.type}
            </p>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="directions">Directions *</label>
            <input
              type="text"
              id="directions"
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              required
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="form-section">
        <h3>Patient Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="first_name">First Name *</label>
            <input
              type="text"
              id="first_name"
              value={patient.first_name}
              onChange={(e) =>
                setPatient({ ...patient, first_name: e.target.value })
              }
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name *</label>
            <input
              type="text"
              id="last_name"
              value={patient.last_name}
              onChange={(e) =>
                setPatient({ ...patient, last_name: e.target.value })
              }
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              value={patient.email}
              onChange={(e) =>
                setPatient({ ...patient, email: e.target.value })
              }
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input
              type="tel"
              id="phone"
              value={patient.phone}
              onChange={(e) =>
                setPatient({ ...patient, phone: e.target.value })
              }
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="gender">Gender *</label>
            <select
              id="gender"
              value={patient.gender}
              onChange={(e) =>
                setPatient({ ...patient, gender: e.target.value as any })
              }
              required
              className="form-control"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date of Birth *</label>
            <div className="dob-group">
              <input
                type="text"
                placeholder="DD"
                value={patient.birth_day}
                onChange={(e) =>
                  setPatient({ ...patient, birth_day: e.target.value })
                }
                maxLength={2}
                required
                className="form-control"
              />
              <input
                type="text"
                placeholder="MM"
                value={patient.birth_month}
                onChange={(e) =>
                  setPatient({ ...patient, birth_month: e.target.value })
                }
                maxLength={2}
                required
                className="form-control"
              />
              <input
                type="text"
                placeholder="YYYY"
                value={patient.birth_year}
                onChange={(e) =>
                  setPatient({ ...patient, birth_year: e.target.value })
                }
                maxLength={4}
                required
                className="form-control"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="address_ln1">Address Line 1 *</label>
          <input
            type="text"
            id="address_ln1"
            value={patient.address_ln1}
            onChange={(e) =>
              setPatient({ ...patient, address_ln1: e.target.value })
            }
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="address_ln2">Address Line 2</label>
          <input
            type="text"
            id="address_ln2"
            value={patient.address_ln2}
            onChange={(e) =>
              setPatient({ ...patient, address_ln2: e.target.value })
            }
            className="form-control"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input
              type="text"
              id="city"
              value={patient.city}
              onChange={(e) => setPatient({ ...patient, city: e.target.value })}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="post_code">Post Code *</label>
            <input
              type="text"
              id="post_code"
              value={patient.post_code}
              onChange={(e) =>
                setPatient({ ...patient, post_code: e.target.value })
              }
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="country">Country *</label>
          <input
            type="text"
            id="country"
            value={patient.country}
            onChange={(e) =>
              setPatient({ ...patient, country: e.target.value })
            }
            required
            className="form-control"
          />
        </div>
      </div>

      {/* Delivery Address */}
      <div className="form-section">
        <h3>Delivery Address</h3>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useSameAddress}
              onChange={(e) => setUseSameAddress(e.target.checked)}
            />
            Same as patient address
          </label>
        </div>

        {!useSameAddress && (
          <>
            <div className="form-group">
              <label htmlFor="del_address_ln1">Address Line 1 *</label>
              <input
                type="text"
                id="del_address_ln1"
                value={deliveryAddress.address_ln1}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    address_ln1: e.target.value,
                  })
                }
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="del_address_ln2">Address Line 2</label>
              <input
                type="text"
                id="del_address_ln2"
                value={deliveryAddress.address_ln2}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    address_ln2: e.target.value,
                  })
                }
                className="form-control"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="del_city">City *</label>
                <input
                  type="text"
                  id="del_city"
                  value={deliveryAddress.city}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      city: e.target.value,
                    })
                  }
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="del_post_code">Post Code *</label>
                <input
                  type="text"
                  id="del_post_code"
                  value={deliveryAddress.post_code}
                  onChange={(e) =>
                    setDeliveryAddress({
                      ...deliveryAddress,
                      post_code: e.target.value,
                    })
                  }
                  required
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="del_country">Country *</label>
              <input
                type="text"
                id="del_country"
                value={deliveryAddress.country}
                onChange={(e) =>
                  setDeliveryAddress({
                    ...deliveryAddress,
                    country: e.target.value,
                  })
                }
                required
                className="form-control"
              />
            </div>
          </>
        )}
      </div>

      {/* Security PIN */}
      <div className="form-section">
        <h3>Security</h3>
        <div className="form-group">
          <label htmlFor="secure_pin">Secure PIN (6 digits) *</label>
          <input
            type="text"
            id="secure_pin"
            value={securePin}
            onChange={(e) => setSecurePin(e.target.value)}
            pattern="[0-9]{6}"
            maxLength={6}
            required
            className="form-control"
          />
        </div>
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary">
        {isLoading ? "Creating Prescription..." : "Create Prescription"}
      </button>
    </form>
  );
}
