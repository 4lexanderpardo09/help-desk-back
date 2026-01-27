import { ApiProperty } from '@nestjs/swagger';
import { UserCandidateDto } from './start-flow-check.dto';

export class LinearTransitionDto {
    @ApiProperty()
    targetStepId: number;

    @ApiProperty()
    targetStepName: string;

    @ApiProperty()
    requiresManualAssignment: boolean;

    @ApiProperty({ type: [UserCandidateDto] })
    candidates: UserCandidateDto[];

    @ApiProperty({ required: false, isArray: true, description: 'List of roles missing users (for parallel steps)' })
    missingRoles?: { id: number; name: string }[];
}

export class DecisionOptionDto {
    @ApiProperty()
    decisionId: string; // The `condicionClave` from FlujoTransicion

    @ApiProperty()
    label: string;

    @ApiProperty()
    targetStepId: number;

    @ApiProperty()
    requiresManualAssignment: boolean;

    @ApiProperty({ type: [UserCandidateDto], required: false })
    candidates?: UserCandidateDto[];

    @ApiProperty({ required: false, isArray: true, description: 'List of roles missing users (for parallel steps)' })
    missingRoles?: { id: number; name: string }[];
}

export class ParallelStatusDto {
    @ApiProperty()
    isBlocked: boolean;

    @ApiProperty({ type: [Object] })
    pendingTasks: any[]; // Define a stricter type if possible (Activity, Agent, Status)
}

export class CheckNextStepResponseDto {
    @ApiProperty({ enum: ['linear', 'decision', 'parallel_pending', 'final'] })
    transitionType: 'linear' | 'decision' | 'parallel_pending' | 'final';

    @ApiProperty({ required: false })
    linear?: LinearTransitionDto;

    @ApiProperty({ type: [DecisionOptionDto], required: false })
    decisions?: DecisionOptionDto[];

    @ApiProperty({ required: false })
    parallelStatus?: ParallelStatusDto;
}
