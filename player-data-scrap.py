import asyncio
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode

async def main():
    target_url = "https://fortnite.gg/island?code=0762-7326-5726"
    print(f"Attempting to crawl: {target_url} in headfull mode.")

    # JavaScript to remove an element by its XPath
    # The XPath you want to exclude is /html/body/div/div[1]/div
    js_to_remove_element = """
    (() => {
        const xpath = `//*[@id="discovery-timeline"]`;
        const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            // console.log('Element removed by XPath:', xpath); // Optional: for debugging in browser console
        } else {
            // console.log('Element not found for XPath:', xpath); // Optional: for debugging
        }
    })();
    """


    js_to_keep_only_creative_stats = """
(() => {
    const xpathToKeep = '//*[@id="creative-stats"]';
    const keepNode = document.evaluate(xpathToKeep, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (!keepNode) {
        console.warn('Target node not found');
        return;
    }

    // Remove all siblings and other body content
    const body = document.body;
    Array.from(body.children).forEach(child => {
        if (child !== keepNode) {
            body.removeChild(child);
        }
    });

    // Reparent the keepNode directly to body if it's deeply nested
    if (keepNode.parentNode !== body) {
        body.innerHTML = '';
        body.appendChild(keepNode);
    }
})();
"""


    browser_conf = BrowserConfig(headless=True)
    run_conf = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        delay_before_return_html=5,  # Wait 5 seconds after page load (and JS execution)
        table_score_threshold=100,
        # Execute the JavaScript to remove the element before HTML is retrieved for Markdown
        js_code=[js_to_keep_only_creative_stats] # Pass as a list of strings
    )

    async with AsyncWebCrawler(config=browser_conf) as crawler:
        result = await crawler.arun(
            url=target_url,
            config=run_conf
        )
        print(result.markdown)

if __name__ == "__main__":
    asyncio.run(main())