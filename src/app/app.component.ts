import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

interface Participant {
    id: number;
    name: string;
}

interface Workshop {
    id: number;
    name: string;
}

interface Group {
    workshopId: number;
    participants: number[];
}

interface Round {
    groups: Group[];
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, ReactiveFormsModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    title = 'Konferenssin työpajasuunnitelma';
    participantCount: number = 0;
    groupCount: number = 0;
    configForm: FormGroup = new FormGroup({
        participantCount: new FormControl(null, [Validators.required, Validators.min(1)]),
        groupCount: new FormControl(null, [Validators.required, Validators.min(1)]),
    });

    rounds: Round[] = [];
    numRounds: number = 0;
    workshops: Workshop[] = [];
    participants: Participant[] = [];
    errorMessage: string = '';

    submitConfig() {
        if (this.configForm.invalid) {
            this.errorMessage = 'Tarkista että kaikki kentät on täytetty oikein.';
            return;
        }

        this.participantCount = this.configForm.value.participantCount;
        this.groupCount = this.configForm.value.groupCount;
        this.calculateDerivedValues();

        if (this.errorMessage) return;

        this.generateSchedule();
    }

    calculateDerivedValues() {
        this.participants = Array(this.participantCount).fill(0).map((_, i) => ({
            id: i,
            name: this.getParticipantName(i)
        }));

        this.workshops = Array(this.groupCount).fill(0).map((_, i) => ({
            id: i,
            name: this.getWorkshopName(i)
        }));

        if (this.participantCount < this.groupCount) {
            this.errorMessage = 'Liian vähän osallistujia työpajojen määrään nähden. Tarvitaan vähintään yhtä monta osallistujaa kuin työpajoja.';
        }
    }

    private generateSchedule() {
        console.log("Luodaan aikataulu...");
        this.rounds = [this.createInitialRound()];

        const [seenWorkshops, seenPeople] = this.createTrackers(this.rounds[0]);

        while (!this.allseenWorkshops(seenWorkshops)) {
            const newRound = this.createNewRound(seenWorkshops, seenPeople);
            this.rounds.push(newRound);
        }

        this.numRounds = this.rounds.length;
    }

    private newRound(): Round {
        return { groups: Array.from({ length: this.groupCount }, (_, i) => ({ workshopId: i, participants: [] })) };
    }

    // This method forces a spread for round 1 where we know no one has met
    private createInitialRound(): Round {
        const round = this.newRound();
        this.participants.forEach((_, index) => {
            const workshopId = index % this.groupCount;
            round.groups[workshopId].participants.push(index);
        });
        return round;
    }

    /* Create 2 arrays of sets to track interactions
     * Base these off of the first round
     */
    private createTrackers(initialRound: Round): [Set<number>[], Set<number>[]] {
        const seenWorkshops = Array.from({ length: this.participantCount }, () => new Set<number>());
        const seenPeople = Array.from({ length: this.participantCount }, () => new Set<number>());

        initialRound.groups.forEach((group, workshopId) => {
            group.participants.forEach(participantId => {
                seenWorkshops[participantId].add(workshopId);
                group.participants.forEach(otherId => {
                    if (participantId !== otherId) {
                        seenPeople[participantId].add(otherId);
                    }
                });
            });
        });

        return [seenWorkshops, seenPeople];
    }

    private createNewRound(seenWorkshops: Set<number>[], seenPeople: Set<number>[]): Round {
        const round = this.newRound();
        const unassignedParticipants = this.getSortedParticipantsByAvailability(seenWorkshops);
        const assignedParticipants = new Set<number>();

        unassignedParticipants.forEach(participantId => {
            if (assignedParticipants.has(participantId)) return;

            const availableWorkshops = this.getUnseenWorkshops(participantId, seenWorkshops);
            const targetWorkshop = this.findSuitableWorkshop(participantId, availableWorkshops, round, seenPeople);

            if (targetWorkshop !== null) {
                this.putParticipantInWorkshop(participantId, targetWorkshop, round, seenWorkshops, seenPeople);
                assignedParticipants.add(participantId);
            }
        });

        return round;
    }

    // Prefer participants who have seen the least number of workshops
    private getSortedParticipantsByAvailability(seenWorkshops: Set<number>[]): number[] {
        return Array.from({ length: this.participantCount }, (_, i) => i)
            .sort((a, b) => (this.groupCount - seenWorkshops[a].size) - (this.groupCount - seenWorkshops[b].size));
    }

    private getUnseenWorkshops(participantId: number, seenWorkshops: Set<number>[]): number[] {
        return Array.from({ length: this.groupCount }, (_, i) => i)
            .filter(workshopId => !seenWorkshops[participantId].has(workshopId));
    }

    private findSuitableWorkshop(
        participantId: number,
        availableWorkshops: number[],
        round: Round,
        seenPeople: Set<number>[]
    ): number | null {
        // Prefer emptier workshops
        const sortedWorkshops = [...availableWorkshops].sort((a, b) => round.groups[a].participants.length - round.groups[b].participants.length);

        for (const workshopId of sortedWorkshops) {
            const hasConflict = round.groups[workshopId].participants.some(existingParticipant => seenPeople[participantId].has(existingParticipant));

            if (!hasConflict) {
                return workshopId;
            }
        }
        return null;
    }

    private putParticipantInWorkshop(
        participantId: number,
        workshopId: number,
        round: Round,
        seenWorkshops: Set<number>[],
        seenPeople: Set<number>[]
    ) {
        round.groups[workshopId].participants.push(participantId);
        seenWorkshops[participantId].add(workshopId);

        round.groups[workshopId].participants.forEach(existingParticipant => {
            if (existingParticipant !== participantId) {
                seenPeople[participantId].add(existingParticipant);
                seenPeople[existingParticipant].add(participantId);
            }
        });
    }

    allseenWorkshops(seenWorkshops: Set<number>[]): boolean {
        return seenWorkshops.every(participantWorkshops => participantWorkshops.size === this.groupCount);
    }

    getParticipantName(index: number): string {
        return `Osallistuja ${index + 1}`;
    }

    getWorkshopLeaderName(index: number): string {
        return `Vetäjä ${index + 1}`;
    }

    getWorkshopName(index: number): string {
        return `Työpaja ${index + 1}`;
    }

    getRoundName(index: number): string {
        return `Kierros ${index + 1}`;
    }
}