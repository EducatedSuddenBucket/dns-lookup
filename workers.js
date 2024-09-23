addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = 'https://liaobots.work/api/user';
  
  const headers = {
    'authority': 'liaobots.work',
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/json',
    'cookie': 'gkp2=DA97mSSrEj98QmpJDy9x',
    'origin': 'https://liaobots.work',
    'referer': 'https://liaobots.work/en',
    'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  };

  const body = JSON.stringify({
    authcode: ""
  });

  try {
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body
    });

    const data = await apiResponse.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response('Error: ' + error.message, { status: 500 });
  }
}
