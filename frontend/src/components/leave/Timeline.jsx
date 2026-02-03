import { Check, X, Clock, User } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';

export const Timeline = ({ approvals, status, department }) => {
  // ตรวจสอบว่าเป็นสถานะยกเลิกหรือไม่
  const isCancelFlow = status?.startsWith('pending_cancel') || status?.startsWith('cancel_level');
  // ตรวจสอบว่าเป็น GOK (ชั้น 3) หรือไม่ - ข้าม ผอ.กลุ่มงาน
  const isGOKDepartment = department === 'GOK';

  const steps = isCancelFlow ? [
    // ขั้นตอนสำหรับการยกเลิก
    {
      level: 0,
      title: 'ขอยกเลิก',
      description: 'ส่งคำขอยกเลิกการลาเข้าสู่ระบบ',
      status: 'completed',
    },
    // ข้าม ผอ.กลุ่มงาน ถ้าเป็น GOK
    ...(isGOKDepartment ? [] : [{
      level: 1,
      title: 'ผู้บังคับบัญชา (ผอ.กลุ่มงาน)',
      description: 'รอพิจารณายกเลิกจากผู้บังคับบัญชา',
      approvalKey: 'cancel_level_1',
    }]),
    {
      level: 2,
      title: 'หัวหน้าฝ่ายบริหารทั่วไป',
      description: 'รอพิจารณายกเลิกจากหัวหน้าฝ่ายบริหารทั่วไป',
      approvalKey: 'cancel_level_2',
    },
    {
      level: 3,
      title: 'ผอ.กลุ่มงานอำนวยการ',
      description: 'รอพิจารณายกเลิกจากผู้อำนวยการกลุ่มงานอำนวยการ',
      approvalKey: 'cancel_level_3',
    },
    {
      level: 4,
      title: 'ผอ.ศูนย์เทคโนโลยีสารสนเทศฯ สป.',
      description: 'อนุมัติยกเลิกขั้นสุดท้ายจากผู้อำนวยการศูนย์ฯ',
      approvalKey: 'cancel_level_4',
    },
  ] : [
    // ขั้นตอนสำหรับการยื่นคำขอลาปกติ
    {
      level: 0,
      title: 'ยื่นคำขอ',
      description: 'ส่งคำขอลาเข้าสู่ระบบ',
      status: 'completed',
    },
    // ข้าม ผอ.กลุ่มงาน ถ้าเป็น GOK
    ...(isGOKDepartment ? [] : [{
      level: 1,
      title: 'ผู้บังคับบัญชา (ผอ.กลุ่มงาน)',
      description: 'รอการอนุมัติจากผู้บังคับบัญชา',
      approvalKey: 'level_1',
    }]),
    {
      level: 2,
      title: 'หัวหน้าฝ่ายบริหารทั่วไป',
      description: 'รอการอนุมัติจากหัวหน้าฝ่ายบริหารทั่วไป',
      approvalKey: 'level_2',
    },
    {
      level: 3,
      title: 'ผอ.กลุ่มงานอำนวยการ',
      description: 'รอการอนุมัติจากผู้อำนวยการกลุ่มงานอำนวยการ',
      approvalKey: 'level_3',
    },
    {
      level: 4,
      title: 'ผอ.ศูนย์เทคโนโลยีสารสนเทศฯ สป.',
      description: 'อนุมัติขั้นสุดท้ายจากผู้อำนวยการศูนย์ฯ',
      approvalKey: 'level_4',
    },
  ];

  const getStepStatus = (step) => {
    if (status === 'cancelled') return 'cancelled';
    if (status === 'rejected') return 'rejected';
    if (step.level === 0) return 'completed';

    // สำหรับ flow ยกเลิก
    if (isCancelFlow) {
      if (status === 'pending_cancel' && step.level === 1) return 'waiting';
      if (status === 'cancel_level1' && step.level === 1) return 'completed';
      if (status === 'cancel_level1' && step.level === 2) return 'waiting';
      if (status === 'cancel_level2' && step.level <= 2) return 'completed';
      if (status === 'cancel_level2' && step.level === 3) return 'waiting';
      if (status === 'cancel_level3' && step.level <= 3) return 'completed';
      if (status === 'cancel_level3' && step.level === 4) return 'waiting';
      return 'pending';
    }

    // สำหรับ flow ปกติ
    const approval = approvals?.find(a => a.approval_level === step.level);
    
    if (approval) {
      return approval.action === 'approved' || approval.status === 'approved' ? 'completed' : 'rejected';
    }

    // สำหรับ GOK - ข้าม Level 1, เริ่มที่ Level 2
    if (isGOKDepartment) {
      if (step.level === 2 && (status === 'approved_level1' || status === 'pending')) return 'waiting';
      if (step.level === 2 && (status === 'approved_level2' || status === 'approved_level3' || status === 'approved')) return 'completed';
      if (step.level === 3 && status === 'approved_level2') return 'waiting';
      if (step.level === 3 && (status === 'approved_level3' || status === 'approved')) return 'completed';
      if (step.level === 4 && status === 'approved_level3') return 'waiting';
      if (step.level === 4 && status === 'approved') return 'completed';
      return 'pending';
    }

    // รองรับทั้ง approved_levelX และ level_X_approved format
    // Check if this step should be waiting
    if (step.level === 1 && status === 'pending') return 'waiting';
    
    // Level 1 completed, Level 2 waiting
    if (step.level === 1 && (status === 'approved_level1' || status === 'level_1_approved' || status === 'approved_level2' || status === 'approved_level3' || status === 'approved')) return 'completed';
    if (step.level === 2 && (status === 'approved_level1' || status === 'level_1_approved')) return 'waiting';
    
    // Level 2 completed, Level 3 waiting
    if (step.level === 2 && (status === 'approved_level2' || status === 'level_2_approved' || status === 'approved_level3' || status === 'approved')) return 'completed';
    if (step.level === 3 && (status === 'approved_level2' || status === 'level_2_approved')) return 'waiting';
    
    // Level 3 completed, Level 4 waiting
    if (step.level === 3 && (status === 'approved_level3' || status === 'level_3_approved' || status === 'approved')) return 'completed';
    if (step.level === 4 && (status === 'approved_level3' || status === 'level_3_approved')) return 'waiting';
    
    // Level 4 completed (final approval)
    if (step.level === 4 && status === 'approved') return 'completed';

    return 'pending';
  };

  const getStepIcon = (stepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return <Check className="w-5 h-5 text-white" />;
      case 'rejected':
        return <X className="w-5 h-5 text-white" />;
      case 'waiting':
        return <Clock className="w-5 h-5 text-white" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-white" />;
      default:
        return <div className="w-2 h-2 bg-white rounded-full" />;
    }
  };

  const getStepColor = (stepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'waiting':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step);
        // ค้นหา approval ทั้งจาก approval_level และ level
        const approval = approvals?.find(a => 
          a.approval_level === step.level || a.level === step.level
        );
        const isLast = index === steps.length - 1;

        return (
          <div key={step.level} className="relative">
            {/* Connector Line */}
            {!isLast && (
              <div
                className={`absolute left-5 top-12 w-0.5 h-16 ${
                  getStepStatus(steps[index + 1]) === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            )}

            {/* Step Content */}
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(
                    stepStatus
                  )}`}
                >
                  {getStepIcon(stepStatus)}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>

                    {/* Approval Info */}
                    {approval && (
                      <div className={`mt-3 p-4 rounded-lg ${
                        approval.action === 'rejected' || approval.status === 'rejected'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-green-50 border border-green-200'
                      }`}>
                        {/* ผู้อนุมัติ */}
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            {approval.approver?.full_name || 
                             approval.approver?.name ||
                             (approval.approver?.first_name ? `${approval.approver.title || ''}${approval.approver.first_name} ${approval.approver.last_name}` : 'ไม่ระบุ')}
                          </span>
                          {(approval.approver?.position || approval.approver?.departments?.department_name) && (
                            <span className="text-gray-500 text-xs">
                              ({approval.approver?.position || approval.approver?.departments?.department_name})
                            </span>
                          )}
                        </div>

                        {/* วันที่ */}
                        <div className="text-xs text-gray-500 mt-1 ml-6">
                          {formatDateTime(approval.approval_date || approval.actionDate)}
                        </div>

                        {/* แสดงเหตุผล/หมายเหตุ */}
                        {(approval.comments || approval.comment) && (
                          <div className={`mt-3 p-3 rounded-lg ${
                            approval.action === 'rejected' || approval.status === 'rejected'
                              ? 'bg-red-100 border-l-4 border-red-400'
                              : 'bg-green-100 border-l-4 border-green-400'
                          }`}>
                            <p className={`text-xs font-semibold mb-1 ${
                              approval.action === 'rejected' || approval.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {approval.action === 'rejected' || approval.status === 'rejected' 
                                ? 'เหตุผลที่ไม่อนุมัติ' 
                                : 'หมายเหตุ'}
                            </p>
                            <p className={`text-sm ${
                              approval.action === 'rejected' || approval.status === 'rejected'
                                ? 'text-red-800'
                                : 'text-green-800'
                            }`}>
                              {approval.comments || approval.comment}
                            </p>
                          </div>
                        )}

                        {/* สถานะ Badge */}
                        <div className="flex items-center gap-2 mt-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                              approval.status === 'approved' || approval.action === 'approved'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                            }`}
                          >
                            {approval.status === 'approved' || approval.action === 'approved' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                เห็นชอบแล้ว
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5" />
                                ไม่อนุมัติ
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Waiting Status */}
                    {stepStatus === 'waiting' && !approval && (
                      <div className="mt-2 text-sm text-yellow-600 font-medium">
                        <Clock className="w-4 h-4 inline mr-1" />
                        กำลังรอการพิจารณา
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
