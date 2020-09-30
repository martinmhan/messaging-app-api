class JSONResponse {
  error: string | null;
  data: any;
  meta: any;

  constructor(error: string, data?: any, meta?: any) {
    this.error = error || null;
    this.data = data || null;
    this.meta = meta || null;
  }
}

export default JSONResponse;
