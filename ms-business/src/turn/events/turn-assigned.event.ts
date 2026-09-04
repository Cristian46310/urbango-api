export const TURN_ASSIGNED_EVENT = 'turn.assigned';

export class TurnAssignedEvent {
  constructor(public readonly turnId: string) {}
}
