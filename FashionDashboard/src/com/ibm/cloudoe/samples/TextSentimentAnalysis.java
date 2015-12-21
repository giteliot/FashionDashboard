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

import org.apache.http.HttpStatus;

import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;

@WebServlet("/TextSentimentAnalysis")
public class TextSentimentAnalysis extends SentimentServlet {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	public TextSentimentAnalysis() {
        super();
    }
	
	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		req.setCharacterEncoding("UTF-8");
		
		String split = null;
		
		try { 
			JSONObject jsonReq;
			JSONArray textsArr;
			
			jsonReq = EntityToJSON(req);
			
			textsArr = (JSONArray) jsonReq.get("messages");

			split = (String) jsonReq.get("split");
			
			Object[] textsArray = (Object[]) textsArr.toArray();
				
			int chunkSize = 100;
			if (split != null)
				chunkSize = Integer.parseInt(split);
				
			Object[][] splittedArrray = SentimentAnalysis.chunkArray(textsArray, chunkSize);
				
			ArrayList<JSONObject> sentiments = (ArrayList<JSONObject>) SentimentAnalysis.processInputs(splittedArrray);
				
			ServletOutputStream servletOutputStream = resp.getOutputStream();
				
			if (split != null){
				textsArr = new JSONArray();
				textsArr.addAll(sentiments);
				servletOutputStream.print(textsArr.serialize());
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
				
				JSONObject sentiment = new JSONObject();
				
				if (pos > 0)
					sentiment.put("positive", pos/nr_pos);
				if (neg > 0)
					sentiment.put("negative", neg/nr_neg);
				
				servletOutputStream.print(sentiment.serialize());
			}
				
			servletOutputStream.flush();
			servletOutputStream.close();
			
		} catch (Exception e) {
			logger.log(Level.SEVERE, "Service error: " + e.getMessage(), e);
			resp.setStatus(HttpStatus.SC_BAD_GATEWAY);
		}
	}
	
	protected JSONObject EntityToJSON(HttpServletRequest request){
		JSONObject jsonObject = null;
		try {
			jsonObject = JSONObject.parse(request.getInputStream());
		} catch (IOException e) {
			e.printStackTrace();
		}	
		return jsonObject;
		
	}

}
