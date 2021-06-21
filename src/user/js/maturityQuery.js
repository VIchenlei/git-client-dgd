let maturityQuery = {
  'staff': `select 0 AS status, credentials_staff_id,DATE_FORMAT(expire_time, '%Y-%m-%d') as cur_time, s.name, dc.name as event_type_id,dd.name as dept_id, dcs.credentials_number, TIMESTAMPDIFF (DAY, CURDATE(), dcs.expire_time) as alarmday from dat_credentials_staff dcs, dat_credentials dc, dat_staff s ,dat_staff_extend{CK} dse, dat_dept{CK} dd where dc.card_type_id = 1 and s.staff_id = dse.staff_id and dse.dept_id = dd.dept_id {str} and dcs.credentials_id = dc.credentials_id and dcs.warn_id = 0 and dcs.staff_id = s.staff_id and TIMESTAMPDIFF (DAY, CURDATE(), dcs.expire_time) <= dc.remind_time {exprString}{deptID};`,
  'vehicle': `select 0 AS status, credentials_vehicle_id,DATE_FORMAT(expire_time, '%Y-%m-%d') as cur_time, v.name, dc.name as event_type_id,dd.name as dept_id, dcv.credentials_number, TIMESTAMPDIFF (DAY, CURDATE(), dcv.expire_time) as alarmday from dat_credentials_vehicle dcv, dat_credentials dc, dat_vehicle v, dat_vehicle_extend dse, dat_dept dd where dc.card_type_id = 2 and v.vehicle_id = dse.vehicle_id and dse.dept_id = dd.dept_id {str} and dcv.credentials_id = dc.credentials_id and dcv.warn_id = 0 and dcv.vehicle_id = v.vehicle_id and TIMESTAMPDIFF (DAY, CURDATE(), dcv.expire_time) <= dc.remind_time {exprString}{deptID};`
}

export default maturityQuery