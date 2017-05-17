import { Component, OnInit } from '@angular/core';
import { ChickService, Chick, ChickDietRecord } from './chick.service';

import { Observable } from 'rxjs/Observable';

class Point { constructor(public x: number, public y: number) { } }

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ChickService]
})
export class AppComponent implements OnInit {
  title = 'app works!';
  records: ChickDietRecord[];
  chicks: Chick[];
  lineChartPoints: Point[];
  lineChartUp: { from: number, to: number };
  lineChartDown: { from: number, to: number };
  quantiles: { [key: string]: number; };
  maxNumberOfWeeks: number;
  quantileChangeInPercent: number;
  dietProportions: number[];

  constructor(private chickService: ChickService) { }

  drawLineChart(lineChartPoints: Point[], multiplierX: number, multiplierY: number): string {

    let firstLine = true;

    const pointToSvgPathString = (point: Point): string => {
      if (firstLine) {
        firstLine = false;
        return `M ${point.x * multiplierX} ${point.y * multiplierY}`;
      }
      return `L ${point.x * multiplierX} ${point.y * multiplierY}`;
    };
    return lineChartPoints.map(pointToSvgPathString).join(' ');
  }

  generatePieChartPaths(dietProportions: number[]): any[] {

    const colors = ['#aaa', '#bbb', '#ccc', '#ddd', '#eee', '#fff'];

    const getCoordinatesForPercent = (percent: number): Point => {
      let x = Math.cos(2 * Math.PI * percent);
      let y = Math.sin(2 * Math.PI * percent);

      return { x, y };
    };

    const pathData = [];

    const dietSum = dietProportions.reduce((acc: number, cur: number) => acc + cur, 0);
    const percents = dietProportions.map(proportion => proportion / dietSum);

    let percent = 0;
    for (let index in percents) {
      const start = getCoordinatesForPercent(percent);

      percent += percents[index];
      const end = getCoordinatesForPercent(percent);
      const largeArcFlag = percent > .5 ? 1 : 0;

      const data = [
        `M ${start.x} ${start.y}`,
        `A 1 1 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
        `L 0 0`,
      ].join(' ');
      pathData.push({
        d: data,
        fill: colors[index]
      });
    }
    return pathData;
  }

  ngOnInit() {

    const chicks: { [key: number]: Chick; } = {};
    let oldestTimestamp = Date.now();
    let maxIncome = 0;

    const findOrCreateChick = (key: number, diet: number): Chick => {
      if (!chicks[key]) {
        chicks[key] = new Chick(key, diet);
      }
      return chicks[key];
    }

    const addChick = (record: ChickDietRecord): ChickDietRecord => {
      const chick = findOrCreateChick(record.chick, record.diet);
      chick.registerRecord(record);
      return record;
    };

    const addIncomeWeekToRecord = (record: ChickDietRecord): ChickDietRecord => {
      const chick = findOrCreateChick(record.chick, record.diet);
      return record.newWithIncomeWeek(chick);
    };

    const findMaxDate = (record: ChickDietRecord): ChickDietRecord => {
      oldestTimestamp = Math.min(oldestTimestamp, record.updated.getTime());
      return record;
    }

    const findMaxIncome = (record: ChickDietRecord): ChickDietRecord => {
      maxIncome = Math.max(record.income, maxIncome);
      return record;
    };

    const dietMap: { [key: number]: number[] } = [];
    const addToDietGroup = (chick: Chick): void => {
      if (!dietMap[chick.diet]) {
        dietMap[chick.diet] = [];
      }
      dietMap[chick.diet].push(chick.maxIncome);
    };

    const getDietPercentList = (): number[] => {
      const result: number[] = [];

      let totalIncomeDiets = 0;

      const avgIncomeForDietList = Object.keys(dietMap).map((x) => {
        const dietIncomeList = dietMap[x];
        const avgIncomeForDiet = dietIncomeList.reduce((acc: number, cur: number) => acc + cur, 0) / dietIncomeList.length;
        totalIncomeDiets += avgIncomeForDiet;
        return avgIncomeForDiet;
      });

      return avgIncomeForDietList.map(x => Math.round(x * 100 / totalIncomeDiets));
    };

    const getXY0To100FromIncomeAndDateForLineChart = (divForX: number, maxX: number, maxY: number) => (record: ChickDietRecord): Point => {
      const x = Math.ceil((record.updated.getTime() - divForX) / maxX * 100);
      const y = Math.ceil((1 - (record.income) / maxY) * 100);
      return new Point(x, y);
    };

    const quantiles = (points: Point[]): { [key: number]: number; } => {
      const incomes = points.map(point => point.y).sort((a, b: number) => a - b);
      const quantileSize = Math.floor(incomes.length / 4);
      const list: { value: number, count: number }[] = [];

      let curQuantile = { value: 0, count: 0 };
      incomes.map((income, index) => {
        if ((index % quantileSize) === 0) {
          list.push(curQuantile);
          curQuantile = { value: 0, count: 0 };
        }
        curQuantile.value += income;
        ++curQuantile.count;
      });

      const result: { [key: string]: number; } = {};

      list.map((cur, index) => {
        let quantilePercent = index * 25;
        result[quantilePercent] = cur.count ? Math.floor(cur.value / cur.count) : 0;
      });

      const halfSize = points.length / 2;
      result.median = points[Math.floor(halfSize)].y + points[Math.ceil(halfSize)].y / 2;

      return result;
    };

    this.chickService.getData()
      .subscribe(records => {
        this.records = records.map(addChick).map(addIncomeWeekToRecord).map(findMaxDate).map(findMaxIncome);

        const list: Chick[] = [];
        for (let i in chicks) {
          if (chicks[i]) {
            const chick = chicks[i];
            list.push(chick);
          }
        }
        this.chicks = list;
        list.map(addToDietGroup);
        this.dietProportions = getDietPercentList();

        const msecondsPeriod = Date.now() - oldestTimestamp;
        const msecondsInWeek = 86400000 * 7;
        this.maxNumberOfWeeks = Math.ceil(msecondsPeriod / msecondsInWeek);
        const getRelativeXYForLineChart = getXY0To100FromIncomeAndDateForLineChart(oldestTimestamp, msecondsPeriod, maxIncome);

        const points = this.records.map(getRelativeXYForLineChart).sort((a, b: Point) => a.x - b.x);
        const pointsMonthAgo = points.filter(point => point.y < 90);
        const quantiles0to100by25 = quantiles(points);
        const quantiles0to100by25MonthAgo = quantiles(pointsMonthAgo);

        const pointMap: { [key: number]: Point[]; } = {};

        const extractPointToMap = (point: Point): void => {
          if (!pointMap[point.x]) {
            pointMap[point.x] = [];
          }
          pointMap[point.x].push(point);
        };
        points.map(extractPointToMap);

        const filteredPointsForLineChart = Object.keys(pointMap).map((x) => {
          const group = pointMap[x];
          const point = group.reduce((acc: { x: number, count: number, y: number}, cur: Point) => {
            ++acc.count;
            acc.y += cur.y;
            return acc;
          }, { x, count: 0, y: 0 });

          return new Point(point.x, Math.floor(point.y / point.count));
        });

        this.lineChartPoints = filteredPointsForLineChart;
        this.lineChartUp = {
          from: quantiles0to100by25[50],
          to: quantiles0to100by25[75]
        };
        this.lineChartDown = {
          from: quantiles0to100by25[50],
          to: quantiles0to100by25[25]
        };

        this.quantiles = quantiles0to100by25;

        this.quantileChangeInPercent = quantiles0to100by25[75] - quantiles0to100by25MonthAgo[75];
      });
  }
}
