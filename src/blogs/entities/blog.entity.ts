export class Blog {
  id: number;
  author: string;
  tag: {
    name: string;
    color: string;
  };
  publishDate: string;
  updateDate: string;
  title: string;
  pictures: string[];
}
