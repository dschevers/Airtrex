// lib/fallbackData.js
export const fallbackData = {
  workOrders: [
    { WorkOrder: 'WO10001' },
    { WorkOrder: 'WO10002' },
    { WorkOrder: 'WO10003' },
    { WorkOrder: 'WO10004' }
  ],
  requesters: [
    { EmployeeID: 1, EmployeeName: 'John Smith' },
    { EmployeeID: 2, EmployeeName: 'Jane Doe' },
    { EmployeeID: 3, EmployeeName: 'Mark Johnson' },
    { EmployeeID: 4, EmployeeName: 'Sarah Williams' }
  ],
  locations: [
    { LocationID: 1, Location: 'Warehouse A' },
    { LocationID: 2, Location: 'Office B' },
    { LocationID: 3, Location: 'Production Floor' },
    { LocationID: 4, Location: 'R&D Lab' }
  ],
  units: [
    { UnitID: 1, UnitOfMeasure: 'Each' },
    { UnitID: 2, UnitOfMeasure: 'Box' },
    { UnitID: 3, UnitOfMeasure: 'Case' },
    { UnitID: 4, UnitOfMeasure: 'Pair' },
    { UnitID: 5, UnitOfMeasure: 'Dozen' },
    { UnitID: 6, UnitOfMeasure: 'Pack' },
    { UnitID: 7, UnitOfMeasure: 'Set' }
  ]
};