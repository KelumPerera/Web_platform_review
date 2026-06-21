import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { itemId, reviewerName, summary, rating, resultsFileUrl, screenshotUrls, errorLogs, specsOs, specsBrowser, specsResolution, testPassed, visitorHash } = await request.json();

    if (!itemId || !reviewerName || !summary || rating === undefined) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (errorLogs && errorLogs.length > 50000) {
      return Response.json({ success: false, error: 'Console logs payload size exceeds 50KB safety limit.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('review_reports')
      .insert({
        item_id: itemId,
        reviewer_name: reviewerName,
        summary,
        rating: parseInt(rating),
        results_file_url: resultsFileUrl || null,
        screenshot_urls: screenshotUrls || [],
        error_logs: errorLogs || null,
        specs_os: specsOs || null,
        specs_browser: specsBrowser || null,
        specs_resolution: specsResolution || null,
        test_passed: testPassed !== undefined ? testPassed : true,
        reviewer_hash: visitorHash || null
      })
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, review: data });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
