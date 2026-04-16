const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('route.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./app/api/communities');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('params: { id: string }')) {
    content = content.replace(/\{ params \}: \{ params: \{ id: string \} \}/g, '{ params }: { params: Promise<{ id: string }> | { id: string } }');
    content = content.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\(req: NextRequest, \{ params \}: \{ params: Promise<\{ id: string \}> \| \{ id: string \} \}\) \{/g, 'export async function $1(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {\n  const resolvedParams = await params;\n  const paramsId = resolvedParams.id;');
    // Then replace all `params.id` with `paramsId` in the file.
    // Be careful not to replace the first `resolvedParams.id` assignment!
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      if (line.includes('const paramsId = resolvedParams.id;')) return line;
      return line.replace(/params\.id/g, 'paramsId');
    });
    fs.writeFileSync(file, newLines.join('\n'), 'utf8');
    console.log('Fixed', file);
  }
});
