import type { StoredPrescription } from '@repo/contracts';

interface PrescriptionListProps {
  prescriptions: StoredPrescription[];
  isLoading: boolean;
}

export function PrescriptionList({ prescriptions, isLoading }: PrescriptionListProps) {
  if (isLoading) {
    return <div className="loading">Loading prescriptions...</div>;
  }

  if (prescriptions.length === 0) {
    return (
      <div className="empty-state">
        <p>No prescriptions yet. Create your first prescription above!</p>
      </div>
    );
  }

  return (
    <div className="prescription-list">
      <h2>Prescription History</h2>
      <div className="prescriptions">
        {prescriptions.map((prescription) => {
          const medicines = JSON.parse(prescription.medicines);
          
          return (
            <div key={prescription.id} className="prescription-card">
              <div className="prescription-header">
                <div>
                  <h3>{prescription.patient_name}</h3>
                  <p className="patient-email">{prescription.patient_email}</p>
                </div>
                <span className={`status-badge status-${prescription.status.toLowerCase()}`}>
                  {prescription.status}
                </span>
              </div>
              
              <div className="prescription-body">
                <div className="prescription-info">
                  <strong>Prescription ID:</strong>
                  <span>{prescription.signaturerx_prescription_id || 'Pending'}</span>
                </div>
                
                <div className="prescription-info">
                  <strong>Created:</strong>
                  <span>{new Date(prescription.created_at).toLocaleString()}</span>
                </div>

                <div className="prescription-info">
                  <strong>Last Updated:</strong>
                  <span>{new Date(prescription.updated_at).toLocaleString()}</span>
                </div>

                <div className="medicines-list">
                  <strong>Medications:</strong>
                  <ul>
                    {medicines.map((med: any, idx: number) => (
                      <li key={idx}>
                        {med.description} - Qty: {med.qty} - {med.directions}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
