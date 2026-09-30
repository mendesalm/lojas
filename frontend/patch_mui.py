import re

path = r'c:\Users\engan\Desktop\Lojas\frontend\src\compartilhado\temas\TemaMui.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update background
content = re.sub(r"default: isDark \? '#050508'", "default: isDark ? '#070F1E'", content)
content = re.sub(r"paper: isDark \? '#0d1b35'", "paper: isDark ? '#0A1428'", content)

# Update Button Contained style
new_btn_style = r"""          contained: {
            backgroundImage: isDark
              ? 'linear-gradient(to right, #C6AB6A, #D1A958, #EBCD79)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: isDark ? '#070F1E' : '#ffffff',
            boxShadow: isDark 
              ? '0 4px 15px rgba(209, 169, 88, 0.3)' 
              : '0 2px 8px rgba(2, 132, 199, 0.3)',
            '&:hover': {
              backgroundImage: isDark
                ? 'linear-gradient(to right, #D1A958, #EBCD79, #C6AB6A)'
                : 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
              boxShadow: isDark ? '0 6px 20px rgba(209, 169, 88, 0.5)' : 'none',
            },
          },"""

# Regex substitution for contained object
content = re.sub(r"          contained: \{.*?\},", new_btn_style, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated TemaMui.ts")
