export default class Pagination {
  constructor(pagination) {
    this.page = pagination.page || 1;
    this.page_size = pagination.page_size || 0;
    this.has_more = pagination.has_more || false;
    this.results = pagination.results || [];
  }
}
