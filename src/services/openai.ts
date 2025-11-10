import { ApplicationType } from '../types';

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface ApplicationMatch {
  name: string;
  similarity: number;
  description: string;
  columnC: string;
  columnD: string;
}

class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async findSimilarApplications(description: string, availableApplications: ApplicationType[]): Promise<ApplicationMatch[]> {
    try {
      console.log('🔍 === PERCENTAGE MATCHING DEBUG START ===');
      console.log('🔍 User description:', description);
      console.log('🔍 Available applications count:', availableApplications.length);
      console.log('🔍 Available applications data:', availableApplications);

      // Always start with Standard as the first option
      const validApplications: ApplicationMatch[] = [{
        name: 'Standard',
        similarity: 100,
        description: 'Default standard application configuration',
        columnC: 'Standard',
        columnD: 'Default standard application configuration'
      }];

      console.log('🔍 Starting PARALLEL percentage matching...');
      console.log('🔍 Processing', availableApplications.length, 'applications in parallel...');

      // Process all applications in parallel for maximum speed
      const startTime = Date.now();
      const matchPromises = availableApplications.map(async (app, i) => {
        const cellLocation = `D${303 + i}`;
        
        if (!app.description || app.description.trim() === '') {
          console.log(`🔍 ❌ Skipping ${cellLocation} - empty description`);
          return null;
        }
        
        try {
          const matchPercentage = await this.getMatchPercentage(description, app.description);
          console.log(`🔍 ${cellLocation}: ${app.name} = ${matchPercentage}%`);
          
          if (matchPercentage >= 65) {
            return {
              name: app.name,
              similarity: matchPercentage,
              description: app.description,
              columnC: app.name,
              columnD: app.description
            };
          }
          return null;
        } catch (error) {
          console.error(`🔍 Error processing ${cellLocation}:`, error);
          return null;
        }
      });
      
      // Wait for all parallel requests to complete
      const matchResults = await Promise.all(matchPromises);
      const processingTime = Date.now() - startTime;
      console.log(`🔍 ⚡ Parallel processing completed in ${processingTime}ms`);
      
      // Filter out null results and add to validApplications
      const matchedApps = matchResults.filter((result): result is ApplicationMatch => result !== null);
      validApplications.push(...matchedApps);
      
      console.log('🔍 === FINAL RESULTS ===');
      console.log('🔍 Total applications found:', validApplications.length);
      validApplications.forEach((app, index) => {
        console.log(`🔍 ${index + 1}. ${app.name} (${app.similarity}%)`);
      });
      
      // Sort by similarity (highest first) and take only top 4 matches (excluding Standard)
      const nonStandardMatches = validApplications.filter(app => app.name !== 'Standard');
      const sortedMatches = nonStandardMatches.sort((a, b) => b.similarity - a.similarity);
      const top4Matches = sortedMatches.slice(0, 4);
      
      // Always include Standard as first option, then top 4 matches
      const finalResults = [
        validApplications.find(app => app.name === 'Standard')!,
        ...top4Matches
      ];
      
      console.log('🔍 === TOP 4 RESULTS ===');
      console.log('🔍 Final applications to show:', finalResults.length);
      finalResults.forEach((app, index) => {
        console.log(`🔍 ${index + 1}. ${app.name} (${app.similarity}%)`);
      });
      
      return finalResults;
    } catch (error) {
      console.error('🔍 Error in findSimilarApplications:', error);
      return [{
        name: 'Standard',
        similarity: 100,
        description: 'Default standard application configuration',
        columnC: 'Standard',
        columnD: 'Default standard application configuration'
      }];
    }
  }

  private async getMatchPercentage(userDescription: string, dColumnDescription: string): Promise<number> {
    try {
      // More strict and detailed prompt for accurate matching
      const prompt = `You are an expert industrial application matcher specializing in solenoid valves and automation systems.

TASK: Compare these two application descriptions and rate their similarity from 0-100.

USER APPLICATION: "${userDescription}"
REFERENCE APPLICATION: "${dColumnDescription}"

MATCHING CRITERIA:
- Industry/sector similarity (manufacturing, automotive, food, etc.)
- Application type similarity (control, automation, fluid handling, etc.)
- Technical requirements similarity (pressure, flow, materials, etc.)
- Use case similarity (specific processes, environments, etc.)

SCORING GUIDELINES:
- 90-100: Nearly identical applications with same industry and use case
- 70-89: Same industry, similar application type with some technical overlap
- 50-69: Related industry or application type with some common elements
- 30-49: Different but potentially compatible applications
- 10-29: Minimal relevance, different industries/applications
- 0-9: No meaningful connection or completely unrelated

Be STRICT in your evaluation. Random text or unrelated descriptions should score very low (0-20).
Generic descriptions should not score high unless they genuinely match.

Return ONLY a number from 0-100:`;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 10,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIResponse = await response.json();
      
      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        return 0;
      }

      // Extract number from response
      const match = content.match(/\d+/);
      const percentage = match ? parseInt(match[0]) : 0;
      
      // Ensure it's within valid range
      const finalPercentage = Math.min(Math.max(percentage, 0), 100);
      return finalPercentage;
    } catch (error) {
      console.error('🔍 Match error:', error);
      return 0;
    }
  }

  async enhanceProductComparison(prompt: string): Promise<string> {
    try {
      console.log('🤖 Enhancing product comparison with AI...');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert product analyst. Your job is to identify and highlight the key differentiating features between product versions by wrapping them in <strong> tags. Be precise and focus only on meaningful differences that justify price differences.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data: OpenAIResponse = await response.json();
      
      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log('✅ Product comparison enhanced successfully');
      return content;
    } catch (error) {
      console.error('🤖 Product comparison enhancement error:', error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService('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');