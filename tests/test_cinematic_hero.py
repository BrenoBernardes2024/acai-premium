"""Browser checks for the scroll-led hero. Run with a local HTTP server running."""

import os
from pathlib import Path
import shutil
import unittest

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("KICK_TEST_URL", "http://127.0.0.1:8000/")
CHROME = os.environ.get("KICK_TEST_CHROMIUM_PATH") or shutil.which("chromium")
SCREENSHOT_DIR = os.environ.get("KICK_TEST_SCREENSHOT_DIR")
ARGS = ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]


class CinematicHeroTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=CHROME, headless=True, args=ARGS
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.contexts = []
        self.errors = []

    def tearDown(self):
        for context in self.contexts:
            context.close()
        self.assertEqual(self.errors, [], "No uncaught application errors")

    def page(self, width=1440, height=900, reduced=False, browser=None):
        context = (browser or self.browser).new_context(
            viewport={"width": width, "height": height},
            reduced_motion="reduce" if reduced else "no-preference",
        )
        self.contexts.append(context)
        page = context.new_page()
        page.set_default_timeout(25000)
        page.on("pageerror", lambda error: self.errors.append(str(error)))
        response = page.goto(BASE_URL, wait_until="networkidle")
        self.assertEqual(response.status, 200)
        page.wait_for_function(
            "document.querySelector('#experiencia').matches('.film-ready,.film-unavailable')"
        )
        if not reduced and "film-ready" in page.locator("#experiencia").get_attribute("class"):
            page.wait_for_function("Number(document.querySelector('#experiencia').dataset.framesLoaded)>=7")
        return page

    def scroll(self, page, progress):
        page.evaluate(
            """(p) => {
                document.documentElement.style.scrollBehavior = 'auto';
                const track = document.querySelector('#experiencia');
                const start = track.getBoundingClientRect().top + scrollY;
                const travel = track.offsetHeight - track.querySelector('.film-sticky').offsetHeight;
                window.scrollTo(0, start + travel * p);
            }""",
            progress,
        )
        page.wait_for_function(
            "(p)=>Math.abs(Number(document.querySelector('#experiencia').dataset.progress)-p)<.0006",
            arg=progress,
        )

    def capture(self, page, name):
        if SCREENSHOT_DIR:
            target = Path(SCREENSHOT_DIR)
            target.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(target / f"{name}.png"))

    def test_complete_story_and_reversal(self):
        page = self.page()
        track = page.locator("#experiencia")
        self.assertIn("film-ready", track.get_attribute("class"))
        self.assertEqual(track.get_attribute("data-frames-loaded"), "8")
        heights = track.evaluate("(e)=>({track:e.offsetHeight,sticky:e.querySelector('.film-sticky').offsetHeight})")
        self.assertGreaterEqual(heights["track"] / heights["sticky"], 6)
        self.capture(page, "desktop-ready")
        scene_images = []
        for position, scene in [(0,"01"),(.14,"02"),(.29,"03"),(.42,"04"),(.59,"05"),(.70,"06"),(.83,"07"),(.94,"08")]:
            self.scroll(page, position)
            self.assertEqual(track.get_attribute("data-scene"), scene)
            scene_images.append(page.locator(".film-photo-canvas").screenshot())
        self.assertEqual(len(set(scene_images)), 8, "Every shot has its own visible image")
        self.scroll(page, .515)
        self.assertEqual(track.get_attribute("data-phase"), "flight")
        self.assertTrue(page.locator(".film-ball-canvas").is_visible())
        self.capture(page, "desktop-ball-pass")
        self.scroll(page, .70)
        self.assertEqual(track.get_attribute("data-phase"), "goal")
        self.assertTrue(page.locator(".film-goal-copy").is_visible())
        self.capture(page, "desktop-goal")
        self.scroll(page, .99)
        self.assertEqual(track.get_attribute("data-phase"), "finish")
        self.assertTrue(page.locator(".film-outro a").is_visible())
        self.assertTrue(page.locator(".film-copy").evaluate("(e)=>e.inert"))
        self.capture(page, "desktop-close")
        self.scroll(page, .14)
        self.assertEqual(track.get_attribute("data-phase"), "ready")
        self.assertEqual(track.get_attribute("data-scene"), "02")

    def test_pause_resume_and_replay(self):
        page = self.page()
        self.scroll(page, .25)
        page.locator("#film-motion").click()
        self.assertEqual(page.locator("#film-motion").get_attribute("aria-pressed"), "false")
        frozen = float(page.locator("#experiencia").get_attribute("data-progress"))
        page.evaluate("window.scrollBy(0,500)")
        page.wait_for_timeout(350)
        self.assertAlmostEqual(float(page.locator("#experiencia").get_attribute("data-progress")), frozen, delta=.005)
        page.locator("#film-motion").click()
        self.scroll(page, .99)
        page.locator("#film-play").click()
        page.wait_for_function("Number(document.querySelector('#experiencia').dataset.progress)<.012")
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "ready")

    def test_mobile_and_menu(self):
        page = self.page(390, 844)
        self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 390)
        self.assertEqual(page.locator(".menu-toggle span").first.evaluate("(e)=>getComputedStyle(e).backgroundColor"), "rgb(237, 242, 230)")
        page.locator(".menu-toggle").click()
        self.assertFalse(page.locator(".mobile-nav").evaluate("(e)=>e.hidden"))
        page.locator(".menu-toggle").click()
        self.capture(page, "mobile-ready")
        self.scroll(page, .29)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "contact")
        self.capture(page, "mobile-contact")
        self.scroll(page, .70)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "goal")
        self.capture(page, "mobile-goal")
        self.scroll(page, .99)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-scene"), "08")
        self.capture(page, "mobile-close")
        self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 390)

    def test_small_mobile_layout(self):
        page = self.page(320, 760)
        self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), 320)
        self.assertTrue(page.locator("#film-motion").is_visible())
        self.scroll(page, .98)
        self.assertTrue(page.locator(".film-outro a").is_visible())
        self.capture(page, "mobile-small-finish")

    def test_viewport_resize_repaints_scene(self):
        page = self.page()
        before = page.locator(".film-photo-canvas").screenshot()
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(400)
        after = page.locator(".film-photo-canvas").screenshot()
        self.assertNotEqual(before, after)
        self.assertEqual(page.locator(".film-photo-canvas").evaluate("(e)=>e.getBoundingClientRect().width"), 390)
        self.scroll(page, .45)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "flight")

    def test_reduced_motion_removes_extra_scroll(self):
        page = self.page(reduced=True)
        self.assertIn("is-static", page.locator("#experiencia").get_attribute("class"))
        self.assertTrue(page.locator("#film-motion").is_disabled())
        heights = page.locator("#experiencia").evaluate("(e)=>({track:e.offsetHeight,sticky:e.querySelector('.film-sticky').offsetHeight})")
        self.assertEqual(heights["track"], heights["sticky"])
        page.locator("#film-play").click()
        self.assertEqual(page.locator("#experiencia").get_attribute("data-progress"), "0.000")
        self.assertTrue(page.locator("#hero-title").is_visible())

    def test_collection_and_bag_still_work(self):
        page = self.page()
        page.locator(".film-explore").click()
        page.locator('[data-product="volt"]').click()
        page.locator('[data-size="42"]').click()
        page.locator("#add-to-bag").click()
        self.assertTrue(page.locator("#bag-dialog").evaluate("(e)=>e.open"))
        self.assertEqual(page.locator("#bag-count").inner_text(), "(1)")
        self.assertIn("BR 42", page.locator("#bag-items").inner_text())
        self.assertEqual(page.locator('input[type="password"]').count(), 0)

    def test_without_webgl_fallback_preserves_navigation(self):
        browser = self.playwright.chromium.launch(executable_path=CHROME, headless=True, args=["--no-sandbox", "--disable-webgl"])
        try:
            page = self.page(browser=browser)
            self.assertIn("film-ready", page.locator("#experiencia").get_attribute("class"))
            self.assertEqual(page.locator(".film-ball-canvas").count(), 0)
            self.scroll(page, .70)
            self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "goal")
            self.scroll(page, .99)
            self.assertEqual(page.locator("#experiencia").get_attribute("data-scene"), "08")
            self.capture(page, "fallback")
            page.locator(".film-outro a").click()
            page.locator('[data-product="flare"]').click()
            self.assertIn("FLARE", page.locator("#dialog-name").inner_text())
            page.context.close()
            self.contexts.remove(page.context)
        finally:
            browser.close()

    def test_missing_frame_preserves_story_and_navigation(self):
        context = self.browser.new_context(viewport={"width":1440,"height":900})
        self.contexts.append(context)
        page = context.new_page()
        page.on("pageerror", lambda error: self.errors.append(str(error)))
        page.route("**/05-goal.webp", lambda route: route.abort())
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_function("document.querySelector('#experiencia').dataset.framesLoaded==='7'")
        self.assertEqual(page.locator("#experiencia").get_attribute("data-frames-failed"), "1")
        self.scroll(page, .70)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-scene"), "06")
        self.scroll(page, .99)
        page.locator(".film-outro a").click()
        self.assertTrue(page.locator("#hero-title").is_visible())

    def test_live_motion_preference_and_context_loss(self):
        page = self.page()
        self.scroll(page, .515)
        page.locator(".film-ball-canvas").evaluate("e=>e.dispatchEvent(new Event('webglcontextlost',{cancelable:true}))")
        self.scroll(page, .70)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-phase"), "goal")
        self.assertFalse(page.locator(".film-ball-canvas").is_visible())
        page.emulate_media(reduced_motion="reduce")
        page.wait_for_function("document.querySelector('#experiencia').classList.contains('is-static')")
        self.assertTrue(page.locator("#film-motion").is_disabled())
        page.emulate_media(reduced_motion="no-preference")
        page.wait_for_function("!document.querySelector('#experiencia').classList.contains('is-static')")
        self.scroll(page, .99)
        self.assertTrue(page.locator(".film-outro a").is_visible())


    def test_static_photo_without_javascript(self):
        context = self.browser.new_context(viewport={"width":390,"height":844}, java_script_enabled=False)
        self.contexts.append(context)
        page = context.new_page()
        page.goto(BASE_URL, wait_until="networkidle")
        self.assertTrue(page.locator("#film-still").is_visible())
        self.assertTrue(page.locator("#film-still").evaluate("e=>e.complete && e.naturalWidth>0"))
        heights = page.locator("#experiencia").evaluate("e=>({track:e.offsetHeight,sticky:e.querySelector('.film-sticky').offsetHeight})")
        self.assertEqual(heights["track"], heights["sticky"])
        page.locator(".film-explore").click()
        self.assertTrue(page.locator("#hero-title").is_visible())

    def test_enabling_motion_after_reduced_initial_load(self):
        page = self.page(reduced=True)
        self.assertEqual(page.locator("#experiencia").get_attribute("data-frames-loaded"), "1")
        self.assertEqual(page.locator(".film-ball-canvas").count(), 0)
        page.emulate_media(reduced_motion="no-preference")
        page.wait_for_function("document.querySelector('#experiencia').dataset.framesLoaded==='8'")
        self.scroll(page, .515)
        self.assertTrue(page.locator(".film-ball-canvas").is_visible())



if __name__ == "__main__":
    unittest.main(verbosity=2)
