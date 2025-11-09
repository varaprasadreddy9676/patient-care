import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  constructor() {}

  to12HourFormat(time: string): string {
    try {
      const min = time.split(':');
      let hours = parseFloat(time);
      let suffix;

      suffix = hours >= 12 ? ' PM' : ' AM';
      hours = ((hours + 11) % 12) + 1;
      time = hours + ':' + min[1] + suffix;

      return time;
    } catch (e) {
      return time;
    }
  }

  dateToDBDate(date: Date) {
    try {
      let day: string = date.getDate().toString();
      day = +day < 10 ? '0' + day : day;
      let month: string = (date.getMonth() + 1).toString();
      month = +month < 10 ? '0' + month : month;

      const year = date.getFullYear().toString();
      const time = date.toLocaleTimeString();
      return year + '-' + month + '-' + day;
    } catch (e) {
      return '';
    }
  }

  toDBdateFormat(date: Date): string {
    try {
      let day: string = date.getDate().toString();
      day = +day < 10 ? '0' + day : day;
      let month: string = (date.getMonth() + 1).toString();
      month = +month < 10 ? '0' + month : month;

      const year = date.getFullYear().toString();
      const time = date.toLocaleTimeString();
      return day + '/' + month + '/' + year;
    } catch (e) {
      return date + '';
    }
  }

  convertTimeIn12HrsFormat(time: string): string {
    // tslint:disable-next-line: radix
    const hours = Number.parseInt(time.substring(0, 2));
    time = time.substring(0, 5);

    if (hours < 12) {
      return time + ' am';
    } else if (hours === 12) {
      return time + ' pm';
    } else {
      const minutes = time.substring(2) + ' pm';
      return hours - 12 < 10
        ? '0' + (hours - 12) + minutes
        : hours - 12 + minutes;
    }
  }

  toDBdate(date: Date): string {
    try {
      let day: string = date.getDate().toString();
      day = +day < 10 ? '0' + day : day;
      let month: string = (date.getMonth() + 1).toString();
      month = +month < 10 ? '0' + month : month;

      const year = date.getFullYear().toString();
      const time = date.toLocaleTimeString();
      return year + '-' + month + '-' + day;
    } catch (e) {
      return date + '';
    }
  }

  dateStringToDate(dt: any): any {
    try {
      const dateArray = dt.split('/');
      const dateString = dateArray[2] + '-' + dateArray[1] + '-' + dateArray[0];
      // // // console.log('DateString', dateString);
      const date = new Date(dateString);
      // // // console.log('Date', date);
      return date;
    } catch (e) {
      return dt;
    }
  }

  getDateDifferenceInDays(date: string | number | Date) {
    return Math.floor(
      (Date.UTC(
        new Date(date).getFullYear(),
        new Date(date).getMonth(),
        new Date(date).getDate()
      ) -
        Date.UTC(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate()
        )) /
        (1000 * 60 * 60 * 24)
    );
  }
}