package com.ibm.cloudoe.samples;

import java.io.IOException;
import java.util.ArrayList;
import java.util.logging.Level;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;

import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;

/**
 * Servlet implementation class TwitterAnalysis
 */

@WebServlet("/SentimentAnalysis")
public class SentimentAnalysis extends SentimentServlet {
	
	private static final long serialVersionUID = 1L;
	
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
				
				ArrayList<JSONObject> sentiments = (ArrayList<JSONObject>) SentimentAnalysis.processInputs(splittedArrray);
				
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
	
	
}



