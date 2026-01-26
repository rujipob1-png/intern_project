/**
 * ActingPersonSelect Component
 * สำหรับเลือกผู้ปฏิบัติหน้าที่แทน (ชั้นเดียวกัน)
 */

import { useState, useEffect } from 'react';
import { Search, User, X } from 'lucide-react';
import { getSameLevelEmployees } from '../../api/acting.api';
import toast from 'react-hot-toast';

export const ActingPersonSelect = ({ value, onChange, required = false }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load employees
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees based on search
  useEffect(() => {
    if (searchTerm) {
      const filtered = employees.filter(emp =>
        emp.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  // Set selected employee when value changes
  useEffect(() => {
    if (value && employees.length > 0) {
      const emp = employees.find(e => e.value === value);
      setSelectedEmployee(emp);
    } else {
      setSelectedEmployee(null);
    }
  }, [value, employees]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const result = await getSameLevelEmployees();
      if (result.success) {
        setEmployees(result.data);
        setFilteredEmployees(result.data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('ไม่สามารถโหลดรายชื่อพนักงานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (employee) => {
    setSelectedEmployee(employee);
    onChange(employee.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedEmployee(null);
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        ผู้ปฏิบัติหน้าที่แทน {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {/* Selected Employee Display */}
        {selectedEmployee ? (
          <div className="flex items-center gap-3 w-full px-4 py-3 border border-slate-300 rounded-lg bg-white">
            <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{selectedEmployee.fullName}</p>
              <p className="text-sm text-slate-500 truncate">{selectedEmployee.employeeCode} - {selectedEmployee.position}</p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Search Input */
          <div>
            <div
              className="flex items-center gap-3 w-full px-4 py-3 border border-slate-300 rounded-lg bg-white cursor-text hover:border-blue-500 transition-colors"
              onClick={() => setIsOpen(true)}
            >
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                className="flex-1 outline-none text-slate-900 placeholder-slate-400"
                placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
              />
            </div>

            {/* Dropdown List */}
            {isOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                />

                {/* Options List */}
                <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-8 text-center text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2">กำลังโหลด...</p>
                    </div>
                  ) : filteredEmployees.length > 0 ? (
                    <ul className="py-2">
                      {filteredEmployees.map((employee) => (
                        <li key={employee.value}>
                          <button
                            type="button"
                            onClick={() => handleSelect(employee)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3"
                          >
                            <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{employee.fullName}</p>
                              <p className="text-sm text-slate-500 truncate">
                                {employee.employeeCode} • {employee.position}
                              </p>
                              {employee.departmentName && (
                                <p className="text-xs text-slate-400 truncate">
                                  {employee.departmentName}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-500">
                      <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p>ไม่พบพนักงานในชั้นเดียวกัน</p>
                      {searchTerm && (
                        <p className="text-sm mt-1">ลองค้นหาด้วยคำอื่น</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info Text */}
      <p className="text-xs text-slate-500">
        * เลือกได้เฉพาะพนักงานที่อยู่ในกอง/ชั้นเดียวกันกับคุณเท่านั้น
      </p>
    </div>
  );
};

export default ActingPersonSelect;
