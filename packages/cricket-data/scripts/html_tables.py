from html.parser import HTMLParser
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.tables=[];self.table=None;self.row=None;self.cell=None;self.heading=False;self.h1=''
 def handle_starttag(self,t,a):
  if t=='h1':self.heading=True
  if t=='table':self.table=[]
  if t=='tr' and self.table is not None:self.row=[]
  if t in ('td','th') and self.row is not None:self.cell=''
 def handle_data(self,d):
  if self.heading:self.h1+=d
  if self.cell is not None:self.cell+=d
 def handle_endtag(self,t):
  if t=='h1':self.heading=False
  if t in ('td','th') and self.cell is not None:self.row.append(' '.join(self.cell.split()));self.cell=None
  if t=='tr' and self.row is not None:self.table.append(self.row);self.row=None
  if t=='table' and self.table is not None:self.tables.append(self.table);self.table=None
