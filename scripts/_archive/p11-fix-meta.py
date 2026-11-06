from docx import Document

p = r'd:\trae work\工作空间\6a9fff36e331b99419567482\Yakeen_网站优化完成报告_p11.docx'
d = Document(p)
cp = d.core_properties
print('before:', repr(cp.author), repr(cp.last_modified_by), repr(cp.title),
      repr(cp.comments), repr(cp.category), repr(cp.subject), repr(cp.keywords))

cp.author = 'Yakeen Lighting'
cp.last_modified_by = 'Yakeen Lighting'
cp.title = 'Yakeen 网站优化完成报告'
cp.subject = 'Yakeen Lighting - Website Optimization Report'
cp.category = 'Yakeen Lighting'
cp.comments = ''
cp.keywords = 'Yakeen Lighting'
d.save(p)

d2 = Document(p)
c2 = d2.core_properties
print('after :', repr(c2.author), repr(c2.last_modified_by), repr(c2.title),
      repr(c2.comments), repr(c2.category), repr(c2.subject), repr(c2.keywords))
print('paras:', len(d2.paragraphs))
