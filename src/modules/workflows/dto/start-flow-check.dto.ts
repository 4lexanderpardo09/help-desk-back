export class UserCandidateDto {
    id: number;
    nombre: string;
    apellido: string;
    cargo?: string;
    email?: string;
}

export class CheckStartFlowResponseDto {
    requiresManualSelection: boolean;
    candidates: UserCandidateDto[];
    initialStepId: number;
    initialStepName: string;
}
