import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/groupby';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/reduce';

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import { CHICKS } from './mock-data';

export class ChickDietRecord {

    get id() {
        return this._id;
    }

    get chick() {
        return this._chickId;
    }

    get diet() {
        return this._dietId;
    }

    private _income: number;
    private _updated: Date;

    get income() {
        return this._income;
    }

    get updated() {
        return this._updated;
    }

    constructor(
        private _id: number,
        private _chickId: number,
        private _dietId: number,
        public someWeekAgo: number,
        public weight: number
    ) {
        this._income = 0;
        this._updated = new Date;
    }

    public newWithIncomeWeek(chick: Chick): ChickDietRecord {
        const clone = new ChickDietRecord(this._id, this._chickId, this._dietId, this.someWeekAgo, this.weight);
        clone._income = chick.calculateIncome(clone.weight);
        chick.addMaxIncome(clone._income);
        clone._updated = chick.calculateWeek(clone.someWeekAgo);
        return clone;
    }
}

export class Chick {

    private _maxWeekAgo: number;
    private _maxIncome: number;
    private _initWeight: number;

    get diet() {
        return this._diet;
    }

    get maxIncome() {
        return this._maxIncome;
    }

    registerRecord(record: ChickDietRecord) {
        this._maxWeekAgo = Math.max(record.someWeekAgo, this._maxWeekAgo);
        if (record.someWeekAgo === 0) {
            this._initWeight = record.weight;
        }
    }

    addMaxIncome(income: number) {
        this._maxIncome = Math.max(this._maxIncome, income);
    }

    calculateIncome(weight: number): number {
        return weight - this._initWeight;
    }

    /**
     * if _maxWeekAgo is now,
     * than weekAgo is yesterday.
     * So, formula is: now - (_maxWeekAgo - weekAgo) weeks
     * @param weekAgo
     */
    calculateWeek(weekAgo: number): Date {
        const weeks = this._maxWeekAgo - weekAgo;
        const millisecondsInWeeks = weeks * 7 * 86400000;
        const now = Date.now();
        return new Date(now - millisecondsInWeeks);
    }

    constructor(
        private _id: number,
        private _diet: number
    ) {
        this._maxWeekAgo = -Infinity;
        this._maxIncome = -Infinity;
        this._initWeight = NaN;
    }
}

let chickId = 100;

function toChickData(data: any): ChickDietRecord {
    return new ChickDietRecord(++chickId, data.Chick, data.Diet, data.Time, data.weight);
};

@Injectable()
export class ChickService {

    private pause = 2000;

    constructor(private http: Http) { }

    getDataWithPause(): Promise<ChickDietRecord[]> {
        return new Promise(resolve => {
            // Simulate server latency with 2 second delay
            setTimeout(() => resolve(this.getData()), this.pause);
        });
    }

    getData(): Observable<ChickDietRecord[]> {
        return this.importData();
    }

    importData(): Observable<ChickDietRecord[]> {
        return Observable.of<ChickDietRecord[]>(CHICKS.map(toChickData));
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }
}