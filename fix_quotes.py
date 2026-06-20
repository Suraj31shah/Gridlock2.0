import glob

files = glob.glob('d:/gridlock2/frontend/src/components/*.jsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    content = content.replace("api/recommend', payload", "api/recommend`, payload")
    content = content.replace("api/zone-risk')", "api/zone-risk`)")
    content = content.replace("api/events';", "api/events`;")
    content = content.replace("api/heatmap')", "api/heatmap`)")
    content = content.replace("api/summary')", "api/summary`)")
    content = content.replace("api/metrics')", "api/metrics`)")
    content = content.replace("api/events')", "api/events`)")
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
