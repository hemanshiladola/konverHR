import React, { useEffect, useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import CommonSelect from "../../../core/common/commonSelect";
import { getDepartureReasons, archiveEmployee } from "./EmployeeServices";
import { toast } from "react-toastify";

interface Props {
  employeeId: number | null;
  onSuccess: () => void;
  onClose: () => void;
}

const ArchiveEmployeeModal: React.FC<Props> = ({
  employeeId,
  onSuccess,
  onClose,
}) => {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    departure_reason_id: "" as any,
    departure_date: dayjs().format("YYYY-MM-DD"),
    departure_description: "",
  });

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const data = await getDepartureReasons();
        setReasons(data.map((r: any) => ({ value: r.id, label: r.name })));
      } catch (error) {
        console.error("Error fetching reasons", error);
      }
    };
    if (employeeId) fetchReasons();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departure_reason_id || !employeeId) {
      toast.error("Please select a departure reason");
      return;
    }

    setLoading(true);
    try {
      await archiveEmployee(employeeId.toString(), {
        ...formData,
        departure_reason_id: Number(formData.departure_reason_id),
      });
      toast.success("Employee archived successfully");
      onSuccess();
      // Use bootstrap instance to hide modal
      const modalElement = document.getElementById("archive_employee_modal");
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    } catch (error) {
      toast.error("Failed to archive employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="archive_employee_modal"
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title">Archive Employee</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label">
                  Departure Reason <span className="text-danger">*</span>
                </label>
                <CommonSelect
                  options={reasons}
                  placeholder="Select Reason"
                  onChange={(opt: any) =>
                    setFormData({ ...formData, departure_reason_id: opt.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  Departure Date <span className="text-danger">*</span>
                </label>
                <DatePicker
                  className="form-control"
                  style={{ width: "100%" }}
                  defaultValue={dayjs()}
                  onChange={(date) =>
                    setFormData({
                      ...formData,
                      departure_date: date ? date.format("YYYY-MM-DD") : "",
                    })
                  }
                />
              </div>
              <div className="mb-0">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Enter departure details..."
                  value={formData.departure_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departure_description: e.target.value,
                    })
                  }
                ></textarea>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={loading}
              >
                {loading ? "Archiving..." : "Confirm Archive"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArchiveEmployeeModal;
