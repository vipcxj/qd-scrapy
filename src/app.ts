import { getBooks } from './books';

getBooks({ pageIndex: 100, pageSize: 40 }).then(books => console.log(JSON.stringify(books, null, 2)));