import { Component } from '@angular/core';
import { Canvas, CanvasRenderingContext2D } from '@nativescript/canvas';
import { LoadEventData, TouchGestureEventData } from '@nativescript/core';

@Component({
  selector: 'app-line-graph',
  template: `
  <StackLayout height="300" class="bg-[#161618] rounded-3xl">
  <Label  class="text-4xl text-white top-0 p-2">\${{value}}</Label>

    <Canvas rowSpan=2 colSpan="2" height="180" (ready)="onCanvasReady($event)" (touch)="onTouch($event)"></Canvas>
    <FlexboxLayout class="justify-center items-center" height="60">
      <ng-container *ngFor="let item of buttons; let i = index">
         <label class="rounded-full px-2 py-1 text-sm font-bold mx-2 text-[#3399ff]" 
            [backgroundColor]="currentView == i ? '#3399ff2b': ''" 
            (tap)="changeTimePeriod(i, item.months)">\{{item.text}}
          </label>
       </ng-container>
    </FlexboxLayout>
  </StackLayout>
  `,
})
export class LineGraphComponent {
  private pointCount = 15;
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private dataSet: { date: Date; value: number; x: number; y: number }[] = [];
  private data: { date: Date; value: number; x: number; y: number }[] = [];
  private selectedMonths: number = 1;
  buttons = [{ months: 1, text: "30 Days" }, { months: 2, text: "60 Days" }, { months: 6, text: "6 Months" }, { months: 12, text: "1 Year" }];
  currentView = 0;
  value: string = '0';

  onCanvasReady(args: LoadEventData) {
    this.canvas = args.object as Canvas;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.dataSet = this.generateMockData();
    this.data = this.dataSet.slice(0, this.pointCount);
    this.width = Number(this.canvas.width);
    this.height = Number(this.canvas.height);
    this.animateLine([{ date: new Date(), value: 1 }], this.data, 0);
    this.drawLine(this.data);
  }

  changeTimePeriod(view: number, months: number) {
    this.currentView = view;
    const oldData = this.data;
    if(this.selectedMonths == months) {
      this.dataSet = this.generateMockData();
    };
    this.selectedMonths = months;
    const newData = this.dataSet.slice(0, months * this.pointCount); 
    
    this.animateLine(oldData, newData, 0);
  }

  previousValue: number;
  generateMockData = () => {
    const data = [];
    const date = new Date();
    const maxChange = 2;

    this.previousValue = Math.random() * 100;
    data.push({ date: new Date(date), value: this.previousValue });

    for (let i = 0; i < 12 * this.pointCount; i++) {
      date.setDate(date.getDate() - 1);
      const change = Math.random() * maxChange * 2 - maxChange;
      let newValue = this.previousValue + change;

      data.push({ date: new Date(date), value: newValue });

      this.previousValue = newValue;
    }

    this.previousValue = data[data.length - 1].value;
    return data;
  };

  getGradient = () => {
    const gradient = this.ctx.createLinearGradient(
      0,
      0,
      0,
      // this.width,
      this.height
    );
    // gradient.addColorStop(0, '#FFD1A1');
    // gradient.addColorStop(0.225, '#AEDFF7');
    // gradient.addColorStop(0.5, '#B5A9D4');
    // gradient.addColorStop(0.75, '#98D1A6');
    // gradient.addColorStop(1, '#FFF6A5');

    gradient._addColorStop(0, '#3399ff');
    gradient._addColorStop(0.5, '#64a9f0');
    gradient._addColorStop(1, 'white');

    return gradient;
  };

  getGradientColor = (pos: number) => {
    this.ctx.fillStyle = this.getGradient();
    this.ctx.fillRect(0, 0, 1, 1);
    return this.ctx.getImageData(0, 0, 1, 1).data.toString();
  };

  animateLine(oldData, newData, animationProgress) {
    const maxLength = Math.max(oldData.length, newData.length);
    const minLength = Math.min(oldData.length, newData.length);
    const interpolatedData = [];

    for (let i = 0; i < maxLength; i++) {
      const isWithinOldData = i < oldData.length;
      const isWithinNewData = i < newData.length;

      let interpolatedValue, x, y;
      if (isWithinOldData && isWithinNewData) {
        const oldValue = oldData[i].value;
        const newValue = newData[i].value;
        interpolatedValue =
          oldValue + (newValue - oldValue) * animationProgress;
        x = (i / (maxLength - 1)) * this.width;
        y = (1 - interpolatedValue / 100) * this.height;
      } else if (isWithinOldData) {
        const progress = (i - minLength + 1) / (maxLength - minLength + 1);
        if (animationProgress <= 1 - progress) {
          interpolatedValue = oldData[i].value;
          x = oldData[i].x;
          y = oldData[i].y;
        } else {
          continue;
        }
      } else if (isWithinNewData) {
        const progress = (i - minLength + 1) / (maxLength - minLength + 1);
        if (animationProgress >= progress) {
          interpolatedValue = newData[i].value;
          x = (i / (maxLength - 1)) * this.width;
          y = (1 - interpolatedValue / 100) * this.height;
        } else {
          continue;
        }
      }

      interpolatedData.push({
        date: new Date(),
        value: interpolatedValue,
        x,
        y,
      });
    }

    this.drawLine(interpolatedData);

    if (animationProgress < 1) {
      const newValue = Number(this.value) + animationProgress * (newData[newData.length - 1].value - Number(this.value));
      this.value = newValue.toFixed(2);

      requestAnimationFrame(() =>
        this.animateLine(oldData, newData, animationProgress + 0.02)
      );
    } else {
      this.data = newData;
      this.drawLine(this.data);
      this.drawDot(this.width - 1)
    }
  }

  calculateYAxisBounds = (
    data: { date: Date; value: number; x: number; y: number }[]
  ) => {
    let minValue = data[0].value;
    let maxValue = data[0].value;

    for (const point of data) {
      minValue = Math.min(minValue, point.value);
      maxValue = Math.max(maxValue, point.value);
    }

    return { minValue, maxValue };
  };

  calculateXYValues = (
    data: { date: Date; value: number; x: number; y: number }[]
  ) => {
    const { minValue, maxValue } = this.calculateYAxisBounds(data);
    const range = maxValue - minValue;
    const padding = range * 0.1;

    return data.map((point, i) => {
      const x = (i / (data.length - 1)) * this.width;
      const y =
        (1 - (point.value - (minValue - padding)) / (range + 2 * padding)) *
        this.height;

      return { ...point, x, y };
    });
  };

  drawLine(data: { date: Date; value: number; x: number; y: number }[]) {
    this.data = this.calculateXYValues(data);
    const gradient = this.getGradient();

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.beginPath();

    for (let i = 1; i < this.data.length; i++) {
      const { x, y } = this.data[i];
      const cp1x = (x - this.data[i - 1].x) / 2 + this.data[i - 1].x;
      const cp1y = this.data[i - 1].y;
      const cp2x = (this.data[i - 1].x + x) / 2;
      const cp2y = y;

      if (i === 1) {
        this.ctx.moveTo(0, y);
      }

      this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 8;
    this.ctx.stroke();
  };

  getYOnBezierCurve = (
    t: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
  ) => {
    const y =
      Math.pow(1 - t, 3) * p0.y +
      3 * Math.pow(1 - t, 2) * t * p1.y +
      3 * (1 - t) * Math.pow(t, 2) * p2.y +
      Math.pow(t, 3) * p3.y;
    return y;
  };

  onTouch(event: TouchGestureEventData) {
    if (event.action !== 'down' && event.action !== 'move') return;

    const x = event.getX() * this.width / 400;
    this.drawDot(x);
  }

  drawDot(x: number) {
    const index = Math.max(
      1,
      Math.min(
        Math.round((x / this.width) * (this.data.length - 1)),
        this.data.length - 1
      )
    );
    const value = this.data[index].value.toFixed(2);

    let t, cp1x, cp1y, cp2x, cp2y, y;
    if (x >= this.data[index].x) {
      if (!this.data[index + 1]?.x) return;
      t =
        (x - this.data[index].x) /
        (this.data[index + 1].x - this.data[index].x);
      cp1x =
        (this.data[index + 1].x - this.data[index].x) / 2 + this.data[index].x;
      cp1y = this.data[index].y;
      cp2x = (this.data[index].x + this.data[index + 1].x) / 2;
      cp2y = this.data[index + 1].y;
      y = this.getYOnBezierCurve(
        t,
        this.data[index],
        { x: cp1x, y: cp1y },
        { x: cp2x, y: cp2y },
        this.data[index + 1]
      );
    } else {
      if (!this.data[index - 1]?.x) return;
      t =
        (x - this.data[index - 1].x) /
        (this.data[index].x - this.data[index - 1].x);
      cp1x =
        (this.data[index].x - this.data[index - 1].x) / 2 +
        this.data[index - 1].x;
      cp1y = this.data[index - 1].y;
      cp2x = (this.data[index - 1].x + this.data[index].x) / 2;
      cp2y = this.data[index].y;
      y = this.getYOnBezierCurve(
        t,
        this.data[index - 1],
        { x: cp1x, y: cp1y },
        { x: cp2x, y: cp2y },
        this.data[index]
      );
    }

    // Draw dot and line
    this.drawLine(this.data);
    this.ctx.beginPath();
    this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
    this.ctx.fillStyle = 'white';
    this.ctx.fill();
    this.ctx.lineWidth = 10;
    this.ctx.stroke();
    this.value = value;
  }
}
