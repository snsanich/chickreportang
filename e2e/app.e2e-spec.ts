import { AngchickreportPage } from './app.po';

describe('angchickreport App', () => {
  let page: AngchickreportPage;

  beforeEach(() => {
    page = new AngchickreportPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
