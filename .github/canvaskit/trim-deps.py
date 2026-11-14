# -*- coding: utf-8 -*-
# Prints a DEPS file holding only the dependencies CanvasKit's npm build compiles, so
# tools/git-sync-deps skips the other ~8 GB (dawn, swiftshader, unicodetools, ...).
import re
import sys

KEEP = ['brotli', 'emsdk', 'freetype', 'harfbuzz', 'icu', 'libjpeg-turbo', 'libpng', 'libwebp', 'wuffs', 'zlib']

src = open(sys.argv[1], encoding='utf-8').read()
pattern = re.compile(r'^\s*"third_party/externals/(%s)"\s*:.*$' % '|'.join(map(re.escape, KEEP)), re.M)
lines = [m.group(0) for m in pattern.finditer(src)]
found = sorted(pattern.match(line).group(1) for line in lines)
if found != sorted(KEEP):
    sys.exit('DEPS entries found %s, expected %s' % (found, sorted(KEEP)))
print('use_relative_paths = True\n\ndeps = {\n%s\n}' % '\n'.join(lines))
