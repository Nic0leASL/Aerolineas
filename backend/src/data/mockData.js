/**
 * Datos de ejemplo para desarrollo y pruebas
 */

export const mockReservations = [
  {
    id: 1,
    userId: 'user_001',
    resourceId: 'sala_1',
    startTime: '2024-04-02T10:00:00Z',
    endTime: '2024-04-02T12:00:00Z',
    status: 'confirmed'
  },
  {
    id: 2,
    userId: 'user_002',
    resourceId: 'sala_2',
    startTime: '2024-04-02T14:00:00Z',
    endTime: '2024-04-02T16:00:00Z',
    status: 'confirmed'
  },
  {
    id: 3,
    userId: 'user_003',
    resourceId: 'sala_1',
    startTime: '2024-04-03T09:00:00Z',
    endTime: '2024-04-03T11:00:00Z',
    status: 'pending'
  }
];

export const mockResources = [
  {
    id: 'sala_1',
    name: 'Sala de Conferencias A',
    capacity: 20,
    location: 'Piso 1'
  },
  {
    id: 'sala_2',
    name: 'Sala de Conferencias B',
    capacity: 15,
    location: 'Piso 2'
  },
  {
    id: 'sala_3',
    name: 'Sala de Conferencias C',
    capacity: 30,
    location: 'Piso 3'
  }
];

export default {
  reservations: mockReservations,
  resources: mockResources
};
