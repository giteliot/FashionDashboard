package com.ibm.cloudoe.samples;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.transform.Result;
import javax.xml.transform.Source;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.ParseException;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.fluent.Response;
import org.apache.http.util.EntityUtils;
import org.w3c.dom.Document;

import com.alchemyapi.api.AlchemyAPI;
import com.ibm.json.xml.XMLToJSONTransformer;
import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;

/**
 * Servlet implementation class TwitterAnalysis
 */
@WebServlet("/SentimentAnalysis")
public class SentimentAnalysis extends HttpServlet {
	private static Logger logger = Logger.getLogger(SentimentAnalysis.class.getName());
	private static final long serialVersionUID = 1L;
	
	private static final int NUM_TWEETS = 500;
	private String serviceName = "IBM Insights for Twitter-vj";
	// If running locally complete the variables below
	// with the information in VCAP_SERVICES
	private String baseURL = "https://0b78b26b-8a5c-4076-bfa7-fa0a595b98ad:XNzv9gKrvl@cdeservice.eu-gb.mybluemix.net";
	private String username = "0b78b26b-8a5c-4076-bfa7-fa0a595b98ad";
	private String password = "XNzv9gKrvl";
	
	private static String alchemyKey = "4202c06ba325660310662c0489eb61df79e9740b";
	
	
    public SentimentAnalysis() {
        super();
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
    //Cerco gli ultimi tweet (al più 500) sull'input (tag), e fa il sentiment su di esso
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		req.setCharacterEncoding("UTF-8");
		// create the request
		String tag = req.getParameter("tag");
		String split = req.getParameter("split");
		
		try {
			HttpResponse httpResponse;
			JSONObject sentiment = new JSONObject();
			JSONObject jsonResp;
			long countRes = 0, from = 0;
			JSONArray tweetsArr;
			
			//conto quanti tweet ci sono contenti tag
			httpResponse = callTwitterInsights("count", tag);
			jsonResp = EntityToJSON(httpResponse.getEntity());
			countRes = (long)((JSONObject) jsonResp.get("search")).get("results");
			
			logger.log(Level.INFO, "Conto "+countRes+" tweet");
			if (countRes > 0) {
				from = 0;
				if (countRes > NUM_TWEETS)
					from = countRes-NUM_TWEETS;
				
				//recupero i tweet e li metto nel file tweets.txt
				httpResponse = callTwitterInsights("search", tag, from);
				jsonResp = EntityToJSON(httpResponse.getEntity());
								
				tweetsArr = (JSONArray) jsonResp.get("tweets");
				
				Object[] tweetsArray = (Object[]) tweetsArr.toArray();
				
				int chunkSize = 100;
				if (split != null)
					chunkSize = Integer.parseInt(split);
				
				Object[][] splittedArrray = SentimentAnalysis.chunkArray(tweetsArray, chunkSize);
				
				ArrayList<JSONObject> sentiments = (ArrayList<JSONObject>) SentimentAnalysis.processInputs(splittedArrray, tag);
				
				ServletOutputStream servletOutputStream = resp.getOutputStream();
				
				if (split != null){
					tweetsArr = new JSONArray();
					tweetsArr.addAll(sentiments);
					servletOutputStream.print(tweetsArr.serialize());
				}else{
					double pos = 0, neg = 0;
					int nr_pos = 0, nr_neg = 0;
					for (JSONObject s : sentiments){
						String p = (String) s.get("positive");
						if (p != null){
							pos += Double.parseDouble(p);
							nr_pos++;
						}
						String n = (String) s.get("negative");
						if (n != null){
							neg += -Double.parseDouble(n);
							nr_neg++;
							}
					}
					sentiment = new JSONObject();
					if (pos > 0)
						sentiment.put("positive", pos/nr_pos);
					if (neg > 0)
						sentiment.put("negative", neg/nr_neg);
					
					servletOutputStream.print(sentiment.serialize());
				}
				
				servletOutputStream.flush();
				servletOutputStream.close();
				
				
			} else {
				logger.log(Level.SEVERE, "WARNING: No tweet found");
			}

			
			

		} catch (Exception e) {
			logger.log(Level.SEVERE, "Service error: " + e.getMessage(), e);
			resp.setStatus(HttpStatus.SC_BAD_GATEWAY);
		}
	}
	
	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		
		doGet(req, resp);
		
	}
	
	public static Object[][] chunkArray(Object[] array, int chunkSize) {
        int numOfChunks = (int)Math.ceil((double)array.length / chunkSize);
        Object[][] output = new Object[numOfChunks][];

        for(int i = 0; i < numOfChunks; ++i) {
            int start = i * chunkSize;
            int length = Math.min(array.length - start, chunkSize);

            Object[] temp = new Object[length];
            System.arraycopy(array, start, temp, 0, length);
            output[i] = temp;
        }

        return output;
    }
	
	public static List<JSONObject> processInputs(Object[][] splittedArrray, final String tag)
	        throws InterruptedException, ExecutionException {

	    int threads = Runtime.getRuntime().availableProcessors();
	    ExecutorService service = Executors.newFixedThreadPool(threads);

	    List<Future<Object>> futures = new ArrayList<Future<Object>>();
	    for (int i = 0; i < splittedArrray.length; i++) {
			final Object[] input = splittedArrray[i];
			Callable<Object> callable = new Callable<Object>() {
	            public JSONObject call() throws Exception {
	            	JSONObject output = new JSONObject();
	            	JSONObject alchemyResp = new JSONObject();
	                
	            	
					String tmpStrTweet = "";
					
					for (int j = 0; j < input.length; j++) {
						JSONObject tweet = (JSONObject)input[j];
						try {
							tmpStrTweet += " " + (String) ((JSONObject) tweet.get("message")).get("body");
								
						}catch (Exception e){
							logger.log(Level.SEVERE, "Tweet error: " + e.getMessage(), e);
						}
					}
					
					AlchemyAPI alchemyObj = AlchemyAPI.GetInstanceFromString(alchemyKey);
					Document doc = alchemyObj.TextGetTextSentiment(tmpStrTweet);
					
					ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
					Source xmlSource = new DOMSource(doc);
					Result outputTarget = new StreamResult(outputStream);
					TransformerFactory.newInstance().newTransformer().transform(xmlSource, outputTarget);
					InputStream is = new ByteArrayInputStream(outputStream.toByteArray());
					
					alchemyResp = JSONObject.parse(XMLToJSONTransformer.transform(is));
					
	            	String key = (String)((JSONObject)((JSONObject)alchemyResp.get("results")).get("docSentiment")).get("type");
					String value = (String)((JSONObject)((JSONObject)alchemyResp.get("results")).get("docSentiment")).get("score");
	            	
					output.put(key, value);
					
	                return output;
	            }
	        };
	        futures.add(service.submit(callable));
		}

	    service.shutdown();

	    List<JSONObject> outputs = new ArrayList<JSONObject>();
	    for (Future<Object> future : futures) {
	        outputs.add((JSONObject) future.get());
	    }
	    return outputs;
	}
	
	
	private HttpResponse callTwitterInsights(String type, String keyword, long from) throws URISyntaxException, ClientProtocolException, IOException {
			String qUrl = baseURL+"/api/v1/messages/"+type+"?q="+URLEncoder.encode(keyword,"UTF-8");
			qUrl += "&size="+NUM_TWEETS+"&from="+from;
			logger.log(Level.SEVERE, "URL -> "+qUrl);
			
			URI profileURI = new URI(qUrl).normalize();
	
			Request profileRequest = Request.Get(profileURI)
					.addHeader("Accept", "application/json");
	
			Executor executor = Executor.newInstance().auth(username, password);
			Response response = executor.execute(profileRequest);
			HttpResponse httpResponse  = response.returnResponse();
		return httpResponse;
	}
	
	
	private HttpResponse callTwitterInsights(String type, String keyword) throws URISyntaxException, ClientProtocolException, IOException {
		String qUrl = baseURL+"/api/v1/messages/"+type+"?q="+URLEncoder.encode(keyword,"UTF-8");
		URI profileURI = new URI(qUrl).normalize();
		logger.log(Level.SEVERE, "URL -> "+qUrl);
		Request profileRequest = Request.Get(profileURI)
				.addHeader("Accept", "application/json");

		Executor executor = Executor.newInstance().auth(username, password);
		Response response = executor.execute(profileRequest);
		HttpResponse httpResponse  = response.returnResponse();
	return httpResponse;
	}
	
	private JSONObject EntityToJSON(HttpEntity entity) {
		String s = "";
		JSONObject persInsOutput = null; 
		try {
			s = EntityUtils.toString(entity);
			persInsOutput = JSONObject.parse(s);
		} catch (IOException e) {
			e.printStackTrace();
		} catch (ParseException e1) {
			e1.printStackTrace();
		}
		return persInsOutput;
	}
	
	
	@Override
	public void init() throws ServletException {
		super.init();
		processVCAPServices();
	}
	
	private void processVCAPServices() {
		logger.info("Processing VCAP_SERVICES");
		JSONObject sysEnv = getVCAPServices();
		if (sysEnv == null)
			return;
		logger.info("Looking for: " + serviceName);

		for (Object key : sysEnv.keySet()) {
			String keyString = (String) key;
			logger.info("found key: " + key);
			if (keyString.startsWith(serviceName)) {
				JSONArray services = (JSONArray) sysEnv.get(key);
				JSONObject service = (JSONObject) services.get(0);
				JSONObject credentials = (JSONObject) service
						.get("credentials");
				baseURL = (String) credentials.get("url");
				username = (String) credentials.get("username");
				password = (String) credentials.get("password");
				logger.info("baseURL  = " + baseURL);
				logger.info("username = " + username);
				logger.info("password = " + password);
			} else {
				logger.info("Doesn't match /^" + serviceName + "/");
			}
		}
	}

	/**
	 * Gets the <b>VCAP_SERVICES</b> environment variable and return it as a
	 * JSONObject.
	 * 
	 * @return the VCAP_SERVICES as Json
	 */
	private JSONObject getVCAPServices() {
		String envServices = System.getenv("VCAP_SERVICES");
		if (envServices == null)
			return null;
		JSONObject sysEnv = null;
		try {
			sysEnv = JSONObject.parse(envServices);
		} catch (IOException e) {
			// Do nothing, fall through to defaults
			logger.log(Level.SEVERE,
					"Error parsing VCAP_SERVICES: " + e.getMessage(), e);
		}
		return sysEnv;
	}
}
