export class PageResponse<T> {
    pageSize: number;
    totalCount: number;
    totalPage: number;
    list: T[];
    constructor(totalCount: number, pageSize: number, list: T[]) {
      this.pageSize = pageSize;
      this.totalCount = totalCount;
      if (totalCount === 0) {
        this.totalPage = 0;
      } else {
        this.totalPage = Math.ceil(totalCount / pageSize);
      }
      this.list = list;
    }
  }